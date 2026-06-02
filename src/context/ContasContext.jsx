import { createContext, useContext, useState, useEffect } from 'react'

const ContasContext = createContext()

function load(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch { return fallback }
}

export function ContasProvider({ children }) {
  const [contas, setContas] = useState(() => load('contas_pagar', []))

  useEffect(() => { localStorage.setItem('contas_pagar', JSON.stringify(contas)) }, [contas])

  const addConta = (conta) => {
    setContas(prev => [...prev, { ...conta, id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }])
  }

  const addContasRecorrentes = (base, meses) => {
    const novas = meses.map((vencimento) => ({
      ...base,
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      vencimento,
      pago: false,
      pagoEm: null,
    }))
    setContas(prev => [...prev, ...novas])
  }

  const marcarPago = (id, pago = true) => {
    setContas(prev => prev.map(c =>
      c.id === id
        ? { ...c, pago, pagoEm: pago ? new Date().toISOString().split('T')[0] : null }
        : c
    ))
  }

  const removeConta = (id) => {
    setContas(prev => prev.filter(c => c.id !== id))
  }

  const getContasMes = (ano, mes) => {
    const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
    return contas.filter(c => c.vencimento.startsWith(prefix))
  }

  return (
    <ContasContext.Provider value={{ contas, addConta, addContasRecorrentes, marcarPago, removeConta, getContasMes }}>
      {children}
    </ContasContext.Provider>
  )
}

export const useContas = () => useContext(ContasContext)
