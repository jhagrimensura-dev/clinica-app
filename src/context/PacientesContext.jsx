import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PacientesContext = createContext()

const fromDB = (r) => ({
  id: r.id,
  nome: r.nome,
  whatsapp: r.whatsapp || '',
  nascimento: r.nascimento || '',
  sexo: r.sexo || '',
  status: r.status || 'Ativo',
  anotacoes: r.anotacoes || '',
  criadoEm: r.criado_em,
})

const toDB = (p, clinicaId) => ({
  id: p.id,
  clinica_id: clinicaId,
  nome: p.nome || '',
  whatsapp: p.whatsapp || '',
  nascimento: p.nascimento || '',
  sexo: p.sexo || '',
  status: p.status || 'Ativo',
  anotacoes: p.anotacoes || '',
})

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('clinica_pacientes') || '[]') } catch { return [] }
}

export function PacientesProvider({ children }) {
  const { clinicaId } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicaId) return
    setLoading(true)
    let migrated = false

    const fetchAll = async () => {
      const { data } = await supabase.from('pacientes').select('*').order('nome', { ascending: true })
      if (data && data.length > 0) {
        setPacientes(data.map(fromDB))
      } else if (!migrated) {
        migrated = true
        const local = loadLocal()
        if (local.length > 0) {
          const rows = local.map(p => toDB(
            { ...p, id: p.id || `pac_${Date.now()}_${Math.random().toString(36).slice(2,6)}` },
            clinicaId
          ))
          await supabase.from('pacientes').upsert(rows, { onConflict: 'id' })
          setPacientes(local)
        }
      }
      setLoading(false)
    }

    fetchAll()

    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(fetchAll, 15000)

    const channel = supabase
      .channel(`pacientes:${clinicaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pacientes', filter: `clinica_id=eq.${clinicaId}` }, ({ eventType, new: n, old: o }) => {
        if (eventType === 'INSERT') setPacientes(prev => prev.find(p => p.id === n.id) ? prev : [...prev, fromDB(n)])
        else if (eventType === 'UPDATE') setPacientes(prev => prev.map(p => p.id === n.id ? fromDB(n) : p))
        else if (eventType === 'DELETE') setPacientes(prev => prev.filter(p => p.id !== o.id))
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') fetchAll() })

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [clinicaId])

  const addPaciente = async (p) => {
    const novo = {
      ...p,
      id: `pac_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      status: p.status || 'Ativo',
      criadoEm: new Date().toISOString(),
    }
    setPacientes(prev => [...prev, novo])
    await supabase.from('pacientes').insert(toDB(novo, clinicaId))
    return novo
  }

  const updatePaciente = async (id, updates) => {
    setPacientes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    const updated = pacientes.find(p => p.id === id)
    if (updated) await supabase.from('pacientes').update(toDB({ ...updated, ...updates }, clinicaId)).eq('id', id)
  }

  const removePaciente = async (id) => {
    setPacientes(prev => prev.filter(p => p.id !== id))
    await supabase.from('pacientes').delete().eq('id', id)
  }

  const clearPacientes = async () => {
    setPacientes([])
    if (clinicaId) await supabase.from('pacientes').delete().eq('clinica_id', clinicaId)
  }

  return (
    <PacientesContext.Provider value={{ pacientes, addPaciente, updatePaciente, removePaciente, clearPacientes, loading }}>
      {children}
    </PacientesContext.Provider>
  )
}

export const usePacientes = () => useContext(PacientesContext)
