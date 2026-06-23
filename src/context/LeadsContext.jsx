import { createContext, useContext, useState, useEffect } from 'react'
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
  criadoEm: r.criado_em,
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
})

export function LeadsProvider({ children }) {
  const { clinicaId } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicaId) return
    setLoading(true)
    supabase
      .from('leads')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('criado_em', { ascending: true })
      .then(({ data }) => {
        if (data) setLeads(data.map(fromDB))
        setLoading(false)
      })
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

  const updateLead = async (id, updates) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
    const updated = leads.find(l => l.id === id)
    if (updated) await supabase.from('leads').update(toDB({ ...updated, ...updates }, clinicaId)).eq('id', id)
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
    <LeadsContext.Provider value={{ leads, addLead, updateLead, removeLead, clearLeads, getLeadsPorOrigem, loading }}>
      {children}
    </LeadsContext.Provider>
  )
}

export const useLeads = () => useContext(LeadsContext)
