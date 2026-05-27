import { createContext, useContext, useState, useEffect } from 'react'

const ClinicaContext = createContext()

function serializeDados(dadosPorMes) {
  const result = {}
  for (const [key, value] of Object.entries(dadosPorMes)) {
    result[key] = {
      diasSelecionados: [...value.diasSelecionados],
      diasValores: value.diasValores,
    }
  }
  return result
}

function deserializeDados(data) {
  if (!data) return {}
  const result = {}
  for (const [key, value] of Object.entries(data)) {
    result[key] = {
      diasSelecionados: new Set(value.diasSelecionados || []),
      diasValores: value.diasValores || {},
    }
  }
  return result
}

function load(key, fallback, deserialize) {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return fallback
    const parsed = JSON.parse(stored)
    return deserialize ? deserialize(parsed) : parsed
  } catch {
    return fallback
  }
}

export function ClinicaProvider({ children }) {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())

  const [metaValor, setMetaValor] = useState(() => load('clinica_metaValor', 200000, null))
  const [superMetaValor, setSuperMetaValor] = useState(() => load('clinica_superMetaValor', null, null))
  const [recordeValor, setRecordeValor] = useState(() => load('clinica_recordeValor', 142500, null))
  const [dadosPorMes, setDadosPorMes] = useState(() => load('clinica_dadosPorMes', {}, deserializeDados))
  const [postsPorMes, setPostsPorMes] = useState(() => load('clinica_postsPorMes', {}, null))

  useEffect(() => { localStorage.setItem('clinica_metaValor', JSON.stringify(metaValor)) }, [metaValor])
  useEffect(() => { localStorage.setItem('clinica_superMetaValor', JSON.stringify(superMetaValor)) }, [superMetaValor])
  useEffect(() => { localStorage.setItem('clinica_recordeValor', JSON.stringify(recordeValor)) }, [recordeValor])
  useEffect(() => { localStorage.setItem('clinica_dadosPorMes', JSON.stringify(serializeDados(dadosPorMes))) }, [dadosPorMes])
  useEffect(() => { localStorage.setItem('clinica_postsPorMes', JSON.stringify(postsPorMes)) }, [postsPorMes])

  const mesKey = `${ano}-${mes}`

  const dadosAtual = dadosPorMes[mesKey] || { diasSelecionados: new Set(), diasValores: {} }
  const diasSelecionados = dadosAtual.diasSelecionados
  const diasValores = dadosAtual.diasValores
  const posts = postsPorMes[mesKey] || []

  const setDiasSelecionados = (updater) => {
    setDadosPorMes(prev => {
      const atual = prev[mesKey] || { diasSelecionados: new Set(), diasValores: {} }
      const novo = typeof updater === 'function' ? updater(atual.diasSelecionados) : updater
      return { ...prev, [mesKey]: { ...atual, diasSelecionados: novo } }
    })
  }

  const setDiasValores = (updater) => {
    setDadosPorMes(prev => {
      const atual = prev[mesKey] || { diasSelecionados: new Set(), diasValores: {} }
      const novo = typeof updater === 'function' ? updater(atual.diasValores) : updater
      return { ...prev, [mesKey]: { ...atual, diasValores: novo } }
    })
  }

  const setPosts = (updater) => {
    setPostsPorMes(prev => {
      const atual = prev[mesKey] || []
      return { ...prev, [mesKey]: typeof updater === 'function' ? updater(atual) : updater }
    })
  }

  const superMeta = superMetaValor ?? metaValor * 1.1
  const diasAtendimento = diasSelecionados.size
  const metaDiaria = diasAtendimento > 0 ? metaValor / diasAtendimento : 0
  const faturamentoTotal = Object.values(diasValores).reduce((acc, v) => acc + (v || 0), 0)
  const porcentagemMeta = metaValor > 0 ? (faturamentoTotal / metaValor) * 100 : 0

  return (
    <ClinicaContext.Provider value={{
      ano, setAno,
      mes, setMes,
      metaValor, setMetaValor,
      superMetaValor, setSuperMetaValor,
      recordeValor, setRecordeValor,
      diasSelecionados, setDiasSelecionados,
      diasValores, setDiasValores,
      posts, setPosts,
      superMeta,
      diasAtendimento,
      metaDiaria,
      faturamentoTotal,
      porcentagemMeta,
    }}>
      {children}
    </ClinicaContext.Provider>
  )
}

export const useClinica = () => useContext(ClinicaContext)
