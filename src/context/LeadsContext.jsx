import { createContext, useContext, useState, useEffect } from 'react'

const LeadsContext = createContext()

function load(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch { return fallback }
}

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState(() => load('clinica_leads', []))

  useEffect(() => { localStorage.setItem('clinica_leads', JSON.stringify(leads)) }, [leads])

  const addLead = (lead) => {
    setLeads(prev => [...prev, {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      criadoEm: new Date().toISOString(),
    }])
  }

  const updateLead = (id, updates) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }

  const removeLead = (id) => {
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  const getLeadsPorOrigem = (origem, ano, mes) => {
    const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
    return leads.filter(l => l.origem === origem && l.data.startsWith(prefix))
  }

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLead, removeLead, getLeadsPorOrigem }}>
      {children}
    </LeadsContext.Provider>
  )
}

export const useLeads = () => useContext(LeadsContext)
