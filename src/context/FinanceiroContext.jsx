import { createContext, useContext, useState, useEffect } from 'react'

const FinanceiroContext = createContext()

const CATEGORIAS_DEFAULT = {
  receitas: [
    { key: 'pix', label: 'Pix' },
    { key: 'dinheiro', label: 'Dinheiro' },
    { key: 'cheque', label: 'Cheque' },
    { key: 'boleto', label: 'Boleto' },
    { key: 'infinitpay', label: 'InfinityPay Antecipação' },
    { key: 'rentabilidade', label: 'Rentabilidade Bradesco PF/PJ' },
  ],
  custos: [
    { key: 'merz', label: 'Merz' },
    { key: 'galderma', label: 'Galderma' },
    { key: 'chris_medic', label: 'Chris Medic - Preenchedores' },
    { key: 'luvas', label: 'Luvas e Máscaras' },
    { key: 'insumos', label: 'Insumos / Pollo Hospitalar' },
    { key: 'frete', label: 'Frete' },
  ],
  despesas: [
    { key: 'aluguel', label: 'Aluguel Jataí' },
    { key: 'condominio', label: 'Condomínio Jataí' },
    { key: 'taxas_prefeitura', label: 'Taxas prefeitura / CRBM' },
    { key: 'pro_labore', label: 'Pró labore Amanda / João Henrique' },
    { key: 'salario_barbara', label: 'Salário Bárbara' },
    { key: 'salario_fernanda', label: 'Salário Fernanda' },
    { key: 'salario_adriele', label: 'Salário Adriele' },
    { key: 'juridico', label: 'Acompanhamento Jurídico' },
    { key: 'celular', label: 'Celular' },
    { key: 'fgts', label: 'FGTS' },
    { key: 'inss', label: 'INSS' },
    { key: 'simples', label: 'Simples Nacional' },
    { key: 'contador', label: 'Contador' },
    { key: 'software', label: 'Software' },
    { key: 'desp_colaboradoras', label: 'Despesas Colaboradoras' },
    { key: 'exp_clinica', label: 'Experiência Clínica (mimos, bolos, cafés)' },
    { key: 'manutencao', label: 'Manutenção Consultório' },
    { key: 'desp_clinica', label: 'Despesas Clínica' },
    { key: 'decoracao', label: 'Decoração (Flores, etc.)' },
    { key: 'taxa_maquininha', label: 'Taxa Maquininha' },
    { key: 'tarifas_bancarias', label: 'Tarifas Bancárias' },
  ],
  investimentos: [
    { key: 'gestor_trafego', label: 'Gestor de Tráfego' },
    { key: 'cursos', label: 'Curso / Congresso' },
    { key: 'desp_cursos', label: 'Despesas Cursos' },
    { key: 'campanhas_offline', label: 'Campanhas Offline' },
    { key: 'equipamentos', label: 'Novos Equipamentos' },
    { key: 'inv_trafego', label: 'Investimento em Tráfego' },
    { key: 'investimento', label: 'Investimento' },
    { key: 'reforma', label: 'Reforma e Melhorias' },
  ],
  emprestimos: [
    { key: 'bradesco', label: 'Crédito Bradesco' },
    { key: 'sicredi', label: 'Crédito Sicredi' },
    { key: 'infinitpay_cred', label: 'Crédito InfinityPay' },
    { key: 'juros_rotativo', label: 'Juros Rotativo / Conta Garantida' },
  ],
}

// Keep exporting CATEGORIAS for backwards compatibility
export const CATEGORIAS = {
  RECEITAS_KEYS: CATEGORIAS_DEFAULT.receitas,
  CUSTOS_KEYS: CATEGORIAS_DEFAULT.custos,
  DESPESAS_KEYS: CATEGORIAS_DEFAULT.despesas,
  INVESTIMENTOS_KEYS: CATEGORIAS_DEFAULT.investimentos,
  EMPRESTIMOS_KEYS: CATEGORIAS_DEFAULT.emprestimos,
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function load(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch { return fallback }
}

function soma(obj) {
  return Object.values(obj || {}).reduce((acc, v) => acc + (Number(v) || 0), 0)
}

export function FinanceiroProvider({ children }) {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [dados, setDados] = useState(() => load('fin_dados', {}))
  const [categorias, setCategorias] = useState(() => load('fin_categorias', CATEGORIAS_DEFAULT))
  const [ocultos, setOcultos] = useState(() => load('fin_ocultos', { receitas: [], custos: [], despesas: [], investimentos: [], emprestimos: [] }))

  useEffect(() => { localStorage.setItem('fin_dados', JSON.stringify(dados)) }, [dados])
  useEffect(() => { localStorage.setItem('fin_categorias', JSON.stringify(categorias)) }, [categorias])
  useEffect(() => { localStorage.setItem('fin_ocultos', JSON.stringify(ocultos)) }, [ocultos])

  const mesKey = `${ano}-${mes}`

  const emptyMes = () => {
    const build = (keys) => Object.fromEntries(keys.map(k => [k.key, 0]))
    return {
      receitas: build(categorias.receitas),
      custos: build(categorias.custos),
      despesas: build(categorias.despesas),
      investimentos: build(categorias.investimentos),
      emprestimos: build(categorias.emprestimos),
    }
  }

  const dadosMes = dados[mesKey] || emptyMes()

  const setValor = (categoria, campo, valor) => {
    setDados(prev => {
      const atual = prev[mesKey] || emptyMes()
      return {
        ...prev,
        [mesKey]: {
          ...atual,
          [categoria]: { ...atual[categoria], [campo]: Number(valor) || 0 },
        },
      }
    })
  }

  const addItem = (categoria, label) => {
    const key = `custom_${Date.now()}`
    setCategorias(prev => ({
      ...prev,
      [categoria]: [...prev[categoria], { key, label }],
    }))
  }

  const removeItem = (categoria, key) => {
    setCategorias(prev => ({
      ...prev,
      [categoria]: prev[categoria].filter(item => item.key !== key),
    }))
    setOcultos(prev => ({ ...prev, [categoria]: (prev[categoria] || []).filter(k => k !== key) }))
  }

  const toggleOculto = (categoria, key) => {
    setOcultos(prev => {
      const lista = prev[categoria] || []
      const jaOculto = lista.includes(key)
      return { ...prev, [categoria]: jaOculto ? lista.filter(k => k !== key) : [...lista, key] }
    })
  }

  const totais = {
    receita: soma(dadosMes.receitas),
    custos: soma(dadosMes.custos),
    despesas: soma(dadosMes.despesas),
    investimentos: soma(dadosMes.investimentos),
    emprestimos: soma(dadosMes.emprestimos),
  }
  totais.totalSaidas = totais.custos + totais.despesas + totais.investimentos + totais.emprestimos
  totais.resultado = totais.receita - totais.totalSaidas

  const resumoAnual = MESES.map((label, i) => {
    const k = `${ano}-${i}`
    const d = dados[k] || emptyMes()
    const rec = soma(d.receitas)
    const saidas = soma(d.custos) + soma(d.despesas) + soma(d.investimentos) + soma(d.emprestimos)
    return { label, receita: rec, saidas, resultado: rec - saidas }
  })

  const resultadoAcumulado = resumoAnual.reduce((acc, m, i) => {
    const prev = i === 0 ? 0 : acc[i - 1]
    acc.push(prev + m.resultado)
    return acc
  }, [])

  return (
    <FinanceiroContext.Provider value={{
      ano, setAno,
      mes, setMes,
      dadosMes,
      setValor,
      categorias,
      addItem,
      removeItem,
      ocultos,
      toggleOculto,
      totais,
      resumoAnual,
      resultadoAcumulado,
      MESES,
    }}>
      {children}
    </FinanceiroContext.Provider>
  )
}

export const useFinanceiro = () => useContext(FinanceiroContext)
