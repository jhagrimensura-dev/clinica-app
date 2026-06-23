import { createContext, useContext, useState } from 'react'

const ClinicaContext = createContext()

const DEFAULTS = { metaValor: 200000, superMetaValor: null, recordeValor: 142500 }

function serializeDados(dadosPorMes) {
  const result = {}
  for (const [key, value] of Object.entries(dadosPorMes)) {
    result[key] = {
      diasSelecionados: [...value.diasSelecionados],
      diasValores: value.diasValores,
      metaValor: value.metaValor,
      superMetaValor: value.superMetaValor,
      recordeValor: value.recordeValor,
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
      metaValor: value.metaValor,
      superMetaValor: value.superMetaValor,
      recordeValor: value.recordeValor,
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

function saveDados(dadosPorMes) {
  localStorage.setItem('clinica_dadosPorMes', JSON.stringify(serializeDados(dadosPorMes)))
}

export function ClinicaProvider({ children }) {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())

  const [dadosPorMes, setDadosPorMes] = useState(() => {
    const dados = load('clinica_dadosPorMes', {}, deserializeDados)
    // migrate old global values into current month if not yet migrated
    const mesKey = `${hoje.getFullYear()}-${hoje.getMonth()}`
    const oldMeta = load('clinica_metaValor', null, null)
    const oldSuper = load('clinica_superMetaValor', null, null)
    const oldRecorde = load('clinica_recordeValor', null, null)
    if (oldMeta !== null && !dados[mesKey]?.metaValor) {
      dados[mesKey] = {
        ...(dados[mesKey] || { diasSelecionados: new Set(), diasValores: {} }),
        metaValor: oldMeta,
        superMetaValor: oldSuper,
        recordeValor: oldRecorde,
      }
    }
    return dados
  })

  const [postsPorMes, setPostsPorMes] = useState(() => load('clinica_postsPorMes', {}, null))

  const mesKey = `${ano}-${mes}`

  const dadosAtual = dadosPorMes[mesKey] || { diasSelecionados: new Set(), diasValores: {} }
  const diasSelecionados = dadosAtual.diasSelecionados
  const diasValores = dadosAtual.diasValores
  const metaValor = dadosAtual.metaValor ?? DEFAULTS.metaValor
  const superMetaValorRaw = dadosAtual.superMetaValor
  const recordeValor = dadosAtual.recordeValor ?? DEFAULTS.recordeValor
  const posts = postsPorMes[mesKey] || []

  const updateMes = (updater) => {
    setDadosPorMes(prev => {
      const atual = prev[mesKey] || { diasSelecionados: new Set(), diasValores: {} }
      const next = { ...prev, [mesKey]: { ...atual, ...updater(atual) } }
      saveDados(next)
      return next
    })
  }

  const setMetaValor = (valor) => updateMes(() => ({ metaValor: valor }))
  const setSuperMetaValor = (valor) => updateMes(() => ({ superMetaValor: valor }))
  const setRecordeValor = (valor) => updateMes(() => ({ recordeValor: valor }))

  const setDiasSelecionados = (updater) => updateMes(atual => ({
    diasSelecionados: typeof updater === 'function' ? updater(atual.diasSelecionados) : updater,
  }))

  const setDiasValores = (updater) => updateMes(atual => ({
    diasValores: typeof updater === 'function' ? updater(atual.diasValores) : updater,
  }))

  const setPosts = (updater) => {
    setPostsPorMes(prev => {
      const atual = prev[mesKey] || []
      const next = { ...prev, [mesKey]: typeof updater === 'function' ? updater(atual) : updater }
      localStorage.setItem('clinica_postsPorMes', JSON.stringify(next))
      return next
    })
  }

  const superMeta = superMetaValorRaw ?? metaValor * 1.1
  const diasAtendimento = diasSelecionados.size
  const metaDiaria = diasAtendimento > 0 ? metaValor / diasAtendimento : 0
  const faturamentoTotal = Object.values(diasValores).reduce((acc, v) => acc + (v || 0), 0)
  const porcentagemMeta = metaValor > 0 ? (faturamentoTotal / metaValor) * 100 : 0

  return (
    <ClinicaContext.Provider value={{
      ano, setAno,
      mes, setMes,
      metaValor, setMetaValor,
      superMetaValor: superMetaValorRaw, setSuperMetaValor,
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
