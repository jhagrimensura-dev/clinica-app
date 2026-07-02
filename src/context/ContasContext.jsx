import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ContasContext = createContext()

const fromDB = (r) => ({
  id: r.id,
  nome: r.nome || '',
  valor: r.valor || 0,
  vencimento: r.vencimento || '',
  pago: r.pago || false,
  pagoEm: r.pago_em || null,
  categoria: r.categoria || '',
  campoKey: r.campo_key || '',
})

const toDB = (c, clinicaId) => ({
  id: c.id,
  clinica_id: clinicaId,
  nome: c.nome || '',
  valor: c.valor || 0,
  vencimento: c.vencimento || '',
  pago: c.pago || false,
  pago_em: c.pagoEm || null,
  categoria: c.categoria || '',
  campo_key: c.campoKey || '',
})

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('contas_pagar') || '[]') } catch { return [] }
}

export function ContasProvider({ children }) {
  const { clinicaId } = useAuth()
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicaId) return
    setLoading(true)

    const fetchAll = async () => {
      const { data } = await supabase.from('contas_pagar').select('*').order('vencimento', { ascending: true })
      if (data) setContas(data.map(fromDB))
      setLoading(false)
    }

    fetchAll().then(async () => {
      const local = loadLocal()
      if (local.length > 0 && contas.length === 0) {
        const rows = local.map(c => toDB(
          { ...c, id: c.id || `c_${Date.now()}_${Math.random().toString(36).slice(2,7)}` },
          clinicaId
        ))
        await supabase.from('contas_pagar').upsert(rows, { onConflict: 'id' })
        setContas(local)
      }
    })

    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(fetchAll, 15000)

    const channel = supabase
      .channel(`contas_pagar:${clinicaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar', filter: `clinica_id=eq.${clinicaId}` }, ({ eventType, new: n, old: o }) => {
        if (eventType === 'INSERT') setContas(prev => prev.find(c => c.id === n.id) ? prev : [...prev, fromDB(n)])
        else if (eventType === 'UPDATE') setContas(prev => prev.map(c => c.id === n.id ? fromDB(n) : c))
        else if (eventType === 'DELETE') setContas(prev => prev.filter(c => c.id !== o.id))
      })
      .subscribe()

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [clinicaId])

  const addConta = async (conta) => {
    const nova = { ...conta, id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
    setContas(prev => [...prev, nova])
    await supabase.from('contas_pagar').insert(toDB(nova, clinicaId))
    return nova
  }

  const addContasRecorrentes = async (base, meses) => {
    const novas = meses.map((vencimento) => ({
      ...base,
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      vencimento,
      pago: false,
      pagoEm: null,
    }))
    setContas(prev => [...prev, ...novas])
    await supabase.from('contas_pagar').insert(novas.map(c => toDB(c, clinicaId)))
  }

  const marcarPago = async (id, pago = true) => {
    const pagoEm = pago ? new Date().toISOString().split('T')[0] : null
    setContas(prev => prev.map(c => c.id === id ? { ...c, pago, pagoEm } : c))
    await supabase.from('contas_pagar').update({ pago, pago_em: pagoEm }).eq('id', id)
  }

  const removeConta = async (id) => {
    setContas(prev => prev.filter(c => c.id !== id))
    await supabase.from('contas_pagar').delete().eq('id', id)
  }

  const getContasMes = (ano, mes) => {
    const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
    return contas.filter(c => c.vencimento.startsWith(prefix))
  }

  return (
    <ContasContext.Provider value={{ contas, addConta, addContasRecorrentes, marcarPago, removeConta, getContasMes, loading }}>
      {children}
    </ContasContext.Provider>
  )
}

export const useContas = () => useContext(ContasContext)
