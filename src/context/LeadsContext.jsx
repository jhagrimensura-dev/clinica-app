import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const LeadsContext = createContext()

const fromDB = (r) => ({
  id: r.id,
  nome: r.nome || '',
  telefone: r.telefone || '',
  origem: r.origem || '',
  origemCustom: r.origem_custom || '',
  data: r.data || '',
  responsavel: r.responsavel || '',
  fonte: r.fonte || '',
  status: r.status || 'em_aberto',
  agendadoPara: r.agendado_para || null,
  proximoFollowup: r.proximo_followup || '',
  obs: r.obs || '',
  aniversario: r.aniversario || null,
  criadoEm: r.criado_em,
  midia: r.midia || null,
  criativo: r.criativo || null,
  linkBio: r.link_bio || null,
})

const toDB = (l, clinicaId) => ({
  id: l.id,
  clinica_id: clinicaId,
  nome: l.nome || '',
  telefone: l.telefone || '',
  origem: l.origem || '',
  origem_custom: l.origemCustom || '',
  data: l.data || '',
  responsavel: l.responsavel || '',
  fonte: l.fonte || '',
  status: l.status || 'em_aberto',
  agendado_para: l.agendadoPara || null,
  proximo_followup: l.proximoFollowup || '',
  obs: l.obs || '',
  aniversario: l.aniversario || null,
  midia: l.midia || null,
  criativo: l.criativo || null,
  link_bio: l.linkBio || null,
})

// Converte só os campos que mudaram, sem incluir id/clinica_id (evita conflito com RLS)
const updatesToDB = (updates) => {
  const fieldMap = {
    nome: 'nome', telefone: 'telefone', origem: 'origem', origemCustom: 'origem_custom',
    data: 'data', responsavel: 'responsavel', fonte: 'fonte', status: 'status',
    agendadoPara: 'agendado_para', proximoFollowup: 'proximo_followup',
    obs: 'obs', aniversario: 'aniversario', midia: 'midia', criativo: 'criativo', linkBio: 'link_bio',
  }
  const out = {}
  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (jsKey in updates) out[dbCol] = updates[jsKey] ?? null
  }
  return out
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('clinica_leads') || '[]') } catch { return [] }
}

export function LeadsProvider({ children }) {
  const { clinicaId } = useAuth()
  const [leads, setLeads] = useState([])
  const leadsRef = useRef([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicaId) return
    setLoading(true)
    let migrated = false

    const fetchAll = async () => {
      const { data } = await supabase.from('leads').select('*').order('criado_em', { ascending: true })
      if (data && data.length > 0) {
        setLeads(data.map(fromDB))
      } else if (!migrated) {
        migrated = true
        const local = loadLocal()
        if (local.length > 0) {
          const rows = local.map(l => toDB(
            { ...l, id: l.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2,6)}` },
            clinicaId
          ))
          await supabase.from('leads').upsert(rows, { onConflict: 'id' })
          setLeads(local)
        }
      }
      setLoading(false)
    }

    fetchAll()

    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(fetchAll, 15000)

    const channel = supabase
      .channel(`leads:${clinicaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `clinica_id=eq.${clinicaId}` }, ({ eventType, new: n, old: o }) => {
        if (eventType === 'INSERT') setLeads(prev => prev.find(l => l.id === n.id) ? prev : [...prev, fromDB(n)])
        else if (eventType === 'UPDATE') setLeads(prev => prev.map(l => l.id === n.id ? fromDB(n) : l))
        else if (eventType === 'DELETE') setLeads(prev => prev.filter(l => l.id !== o.id))
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') fetchAll() })

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [clinicaId])

  const addLead = async (lead) => {
    const novo = {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      criadoEm: new Date().toISOString(),
    }
    setLeads(prev => [...prev, novo])
    await supabase.from('leads').insert(toDB(novo, clinicaId))
    return novo
  }

  useEffect(() => { leadsRef.current = leads }, [leads])

  const updateLead = async (id, updates) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
    const dbUpdates = updatesToDB(updates)
    if (Object.keys(dbUpdates).length === 0) return
    const { error } = await supabase.from('leads').update(dbUpdates).eq('id', id).eq('clinica_id', clinicaId)
    if (error) console.error('updateLead error:', error, id, updates)
  }

  const importLeads = async (leadsArray) => {
    const existingNames = new Set(leads.map(l => (l.nome || '').toLowerCase().trim()))
    const novos = leadsArray
      .filter(l => !existingNames.has((l.nome || '').toLowerCase().trim()))
      .map(l => ({ id: crypto.randomUUID(), criado_em: new Date().toISOString(), status: 'perdido', origem: 'leads_novos', origemCustom: 'WhatsApp', telefone: '', obs: '', responsavel: '', fonte: '', agendadoPara: null, proximoFollowup: '', aniversario: null, ...l }))
    if (!novos.length) return 0
    setLeads(prev => [...prev, ...novos])
    await supabase.from('leads').insert(novos.map(n => toDB(n, clinicaId)))
    return novos.length
  }

  const removeLead = async (id) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    await supabase.from('leads').delete().eq('id', id)
  }

  const clearLeads = async () => {
    setLeads([])
    if (clinicaId) await supabase.from('leads').delete().eq('clinica_id', clinicaId)
  }

  const getLeadsPorOrigem = (origem, ano, mes) => {
    const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
    return leads.filter(l => l.origem === origem && l.data.startsWith(prefix))
  }

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLead, removeLead, clearLeads, getLeadsPorOrigem, importLeads, loading }}>
      {children}
    </LeadsContext.Provider>
  )
}

export const useLeads = () => useContext(LeadsContext)
