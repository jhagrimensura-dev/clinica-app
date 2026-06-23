import { createContext, useContext, useState, useEffect } from 'react'

const PacientesContext = createContext()

function load(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch { return fallback }
}

export function PacientesProvider({ children }) {
  const [pacientes, setPacientes] = useState(() => load('clinica_pacientes', []))

  useEffect(() => { localStorage.setItem('clinica_pacientes', JSON.stringify(pacientes)) }, [pacientes])

  const addPaciente = (p) => {
    setPacientes(prev => [...prev, {
      ...p,
      id: `pac_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      status: 'Ativo',
      criadoEm: new Date().toISOString(),
    }])
  }

  const updatePaciente = (id, updates) => {
    setPacientes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const removePaciente = (id) => {
    setPacientes(prev => prev.filter(p => p.id !== id))
  }

  const clearPacientes = () => setPacientes([])

  return (
    <PacientesContext.Provider value={{ pacientes, addPaciente, updatePaciente, removePaciente, clearPacientes }}>
      {children}
    </PacientesContext.Provider>
  )
}

export const usePacientes = () => useContext(PacientesContext)
