import { createContext, useContext, useState } from 'react'

const ClinicaContext = createContext()

export function ClinicaProvider({ children }) {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())

  const [metaValor, setMetaValor] = useState(200000)
  const [superMetaValor, setSuperMetaValor] = useState(null)
  const [recordeValor, setRecordeValor] = useState(142500)

  // Dados separados por mês: chave = "ano-mes"
  const [dadosPorMes, setDadosPorMes] = useState({})
  const [postsPorMes, setPostsPorMes] = useState({})

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
