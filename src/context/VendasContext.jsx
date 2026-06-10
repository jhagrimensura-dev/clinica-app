import { createContext, useContext, useState, useEffect } from 'react'

const VendasContext = createContext()

function load(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch { return fallback }
}

export function VendasProvider({ children }) {
  const [lancamentos, setLancamentos] = useState(() => load('clinica_vendas', []))

  useEffect(() => { localStorage.setItem('clinica_vendas', JSON.stringify(lancamentos)) }, [lancamentos])

  const addLancamento = (l) => {
    setLancamentos(prev => [...prev, {
      ...l,
      id: `venda_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      criadoEm: new Date().toISOString(),
    }])
  }

  const removeLancamento = (id) => setLancamentos(prev => prev.filter(l => l.id !== id))

  const updateLancamento = (id, dados) =>
    setLancamentos(prev => prev.map(l => l.id === id ? { ...l, ...dados } : l))

  return (
    <VendasContext.Provider value={{ lancamentos, addLancamento, removeLancamento, updateLancamento }}>
      {children}
    </VendasContext.Provider>
  )
}

export const useVendas = () => useContext(VendasContext)
