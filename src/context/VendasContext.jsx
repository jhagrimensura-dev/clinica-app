import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const VendasContext = createContext()

const fromDB = (r) => ({
  id: r.id,
  paciente: r.paciente || '',
  data: r.data || '',
  tipo: r.tipo || '',
  responsavel: r.responsavel || '',
  procedimentos: r.procedimentos || '',
  valorTaxa: r.valor_taxa || 0,
  valorTratamento: r.valor_tratamento || 0,
  formasPgto: r.formas_pgto || [],
  agendado: r.agendado || false,
  obs: r.obs || '',
  criadoEm: r.criado_em,
})

const toDB = (l, clinicaId) => ({
  id: l.id,
  clinica_id: clinicaId,
  paciente: l.paciente || '',
  data: l.data || '',
  tipo: l.tipo || '',
  responsavel: l.responsavel || '',
  procedimentos: l.procedimentos || '',
  valor_taxa: l.valorTaxa || 0,
  valor_tratamento: l.valorTratamento || 0,
  formas_pgto: l.formasPgto || [],
  agendado: l.agendado || false,
  obs: l.obs || '',
})

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('clinica_vendas') || '[]') } catch { return [] }
}

export function VendasProvider({ children }) {
  const { clinicaId } = useAuth()
  const [lancamentos, setLancamentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicaId) return
    setLoading(true)
    supabase
      .from('lancamentos')
      .select('*')
      .order('data', { ascending: true })
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          setLancamentos(data.map(fromDB))
        } else {
          const local = loadLocal()
          if (local.length > 0) {
            const rows = local.map(l => toDB(
              { ...l, id: l.id || `venda_${Date.now()}_${Math.random().toString(36).slice(2,6)}` },
              clinicaId
            ))
            await supabase.from('lancamentos').upsert(rows, { onConflict: 'id' })
            setLancamentos(local)
          }
        }
        setLoading(false)
      })

    const channel = supabase
      .channel(`lancamentos:${clinicaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos', filter: `clinica_id=eq.${clinicaId}` }, ({ eventType, new: n, old: o }) => {
        if (eventType === 'INSERT') setLancamentos(prev => prev.find(l => l.id === n.id) ? prev : [...prev, fromDB(n)])
        else if (eventType === 'UPDATE') setLancamentos(prev => prev.map(l => l.id === n.id ? fromDB(n) : l))
        else if (eventType === 'DELETE') setLancamentos(prev => prev.filter(l => l.id !== o.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [clinicaId])

  const addLancamento = async (l) => {
    const novo = {
      ...l,
      id: `venda_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      criadoEm: new Date().toISOString(),
    }
    setLancamentos(prev => [...prev, novo])
    await supabase.from('lancamentos').insert(toDB(novo, clinicaId))
    return novo
  }

  const removeLancamento = async (id) => {
    setLancamentos(prev => prev.filter(l => l.id !== id))
    await supabase.from('lancamentos').delete().eq('id', id)
  }

  const updateLancamento = async (id, dados) => {
    setLancamentos(prev => prev.map(l => l.id === id ? { ...l, ...dados } : l))
    const updated = lancamentos.find(l => l.id === id)
    if (updated) await supabase.from('lancamentos').update(toDB({ ...updated, ...dados }, clinicaId)).eq('id', id)
  }

  const clearLancamentos = async () => {
    setLancamentos([])
    if (clinicaId) await supabase.from('lancamentos').delete().eq('clinica_id', clinicaId)
  }

  return (
    <VendasContext.Provider value={{ lancamentos, addLancamento, removeLancamento, updateLancamento, clearLancamentos, loading }}>
      {children}
    </VendasContext.Provider>
  )
}

export const useVendas = () => useContext(VendasContext)
