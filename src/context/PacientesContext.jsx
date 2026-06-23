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

export function PacientesProvider({ children }) {
  const { clinicaId } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicaId) return
    setLoading(true)
    supabase
      .from('pacientes')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('nome', { ascending: true })
      .then(({ data }) => {
        if (data) setPacientes(data.map(fromDB))
        setLoading(false)
      })
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
