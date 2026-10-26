import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts'
import { useFinanceiro, CATEGORIAS } from '../context/FinanceiroContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fmt = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtShort = (v) => {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1000) return `R$${(n / 1000).toFixed(0)}k`
  return `R$${n.toFixed(0)}`
}

function CurrencyInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')

  const handleFocus = () => {
    setFocused(true)
    setRaw(value === 0 ? '' : String(value))
  }

  const handleBlur = () => {
    setFocused(false)
    const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.')
    onChange(parseFloat(cleaned) || 0)
  }

  const handleChange = (e) => setRaw(e.target.value)

  return (
    <input
      type={focused ? 'text' : 'text'}
      value={focused ? raw : (value === 0 ? '' : fmt(value))}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      placeholder="R$ 0,00"
      className="w-full text-right px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 bg-gray-50 focus:bg-white transition-all"
    />
  )
}

function Secao({ titulo, cor, icon, keys, ocultosList, categoria, dados, setValor, total, onAdd, onRemove, onToggleOculto }) {
  const [aberto, setAberto] = useState(true)
  const [adicionando, setAdicionando] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [mostrarOcultos, setMostrarOcultos] = useState(false)

  const cores = {
    green: { header: 'bg-green-50 border-green-200', title: 'text-green-700', badge: 'bg-green-100 text-green-700', dot: 'bg-green-400', btn: 'text-green-600 hover:bg-green-50', ocultos: 'bg-green-50 border-green-100 text-green-600' },
    red: { header: 'bg-red-50 border-red-200', title: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-400', btn: 'text-red-600 hover:bg-red-50', ocultos: 'bg-red-50 border-red-100 text-red-600' },
    orange: { header: 'bg-orange-50 border-orange-200', title: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400', btn: 'text-orange-600 hover:bg-orange-50', ocultos: 'bg-orange-50 border-orange-100 text-orange-600' },
    blue: { header: 'bg-blue-50 border-blue-200', title: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', btn: 'text-blue-600 hover:bg-blue-50', ocultos: 'bg-blue-50 border-blue-100 text-blue-600' },
    purple: { header: 'bg-purple-50 border-purple-200', title: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400', btn: 'text-purple-600 hover:bg-purple-50', ocultos: 'bg-purple-50 border-purple-100 text-purple-600' },
  }
  const c = cores[cor] || cores.green

  const visíveis = keys.filter(k => !ocultosList.includes(k.key))
  const ocultos = keys.filter(k => ocultosList.includes(k.key))

  const confirmarAdd = () => {
    if (novoNome.trim()) { onAdd(categoria, novoNome.trim()); setNovoNome('') }
    setAdicionando(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setAberto(a => !a)}
        className={`w-full flex items-center justify-between px-6 py-4 border-b ${c.header} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className={`font-bold text-base ${c.title}`}>{titulo}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${c.badge}`}>{fmt(total)}</span>
          <span className="text-gray-400 text-xs">{aberto ? '▲' : '▼'}</span>
        </div>
      </button>
      {aberto && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {visíveis.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 group">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate mb-1">{label}</p>
                  <CurrencyInput
                    value={dados[key] || 0}
                    onChange={(v) => setValor(categoria, key, v)}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0 mt-4 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => onToggleOculto(categoria, key)}
                    className="text-gray-300 hover:text-yellow-500 text-xs leading-none"
                    title="Ocultar campo"
                  >👁</button>
                  {key.startsWith('custom_') && (
                    <button
                      onClick={() => onRemove(categoria, key)}
                      className="text-gray-300 hover:text-red-400 text-xs leading-none"
                      title="Excluir campo"
                    >✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {adicionando ? (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              <input
                autoFocus
                type="text"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmarAdd(); if (e.key === 'Escape') setAdicionando(false) }}
                placeholder="Nome do campo..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-brand-400"
              />
              <button onClick={confirmarAdd} className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg font-semibold">Adicionar</button>
              <button onClick={() => setAdicionando(false)} className="text-xs text-gray-400 px-2 py-1.5">Cancelar</button>
            </div>
          ) : (
            <button
              onClick={() => setAdicionando(true)}
              className={`mt-3 pt-3 border-t border-gray-100 w-full text-xs font-semibold py-1.5 rounded-lg transition-colors ${c.btn}`}
            >
              + Adicionar campo
            </button>
          )}

          {ocultos.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setMostrarOcultos(v => !v)}
                className={`w-full text-xs font-semibold py-1.5 px-3 rounded-lg border transition-colors ${c.ocultos}`}
              >
                {mostrarOcultos ? '▲' : '▼'} Campos ocultos ({ocultos.length})
              </button>
              {mostrarOcultos && (
                <div className="mt-2 space-y-1.5">
                  {ocultos.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <span className="text-xs text-gray-400 italic">{label}</span>
                      <button
                        onClick={() => onToggleOculto(categoria, key)}
                        className="text-xs text-brand-500 font-semibold hover:text-brand-700 ml-2"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  )
}

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const ANO_ATUAL = new Date().getFullYear()
const ANOS_HISTORICO = Array.from({ length: ANO_ATUAL - 2021 }, (_, i) => 2022 + i)

function Historico() {
  const { clinicaId } = useAuth()
  const [dados, setDados] = useState({})     // dados do Supabase lancamentos
  const [manuais, setManuais] = useState({}) // dados inseridos manualmente
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // key "2023-04"
  const [editRaw, setEditRaw] = useState('')
  const [tipoGrafico, setTipoGrafico] = useState('linha')

  useEffect(() => {
    if (!clinicaId) return
    setLoading(true)
    Promise.all([
      supabase.from('lancamentos')
        .select('data, valor_tratamento, valor_taxa, tipo')
        .eq('clinica_id', clinicaId)
        .neq('tipo', 'Paciente Modelo'),
      supabase.from('configuracoes')
        .select('valor')
        .eq('chave', 'historico_manual')
        .maybeSingle(),
    ]).then(([{ data: lancs }, { data: cfg }]) => {
      const map = {}
      for (const l of (lancs || [])) {
        if (!l.data) continue
        const ym = l.data.slice(0, 7)
        map[ym] = (map[ym] || 0) + (l.valor_tratamento || 0) + (l.valor_taxa || 0)
      }
      setDados(map)
      try { setManuais(cfg?.valor ? JSON.parse(cfg.valor) : {}) } catch { setManuais({}) }
      setLoading(false)
    })
  }, [clinicaId])

  const saveManuais = async (next) => {
    setManuais(next)
    await supabase.from('configuracoes').upsert(
      { chave: 'historico_manual', valor: JSON.stringify(next) },
      { onConflict: 'chave' }
    )
  }

  const valor = (k) => dados[k] || manuais[k] || 0
  const isManual = (k) => !dados[k] && !!manuais[k]
  const fromSupa = (k) => !!dados[k]

  const startEdit = (k) => {
    if (fromSupa(k)) return
    setEditando(k)
    const v = manuais[k] || 0
    setEditRaw(v ? String(v) : '')
  }

  const commitEdit = async (k) => {
    const cleaned = editRaw.replace(/[^\d,]/g, '').replace(',', '.')
    const num = parseFloat(cleaned) || 0
    const next = { ...manuais }
    if (num > 0) next[k] = num
    else delete next[k]
    await saveManuais(next)
    setEditando(null)
    setEditRaw('')
  }

  const fmtK = (v) => {
    if (!v) return '—'
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }
  const fmtFull = (v) => v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'

  const totalAno = (ano) => MESES_ABREV.reduce((s, _, i) => {
    const k = `${ano}-${String(i + 1).padStart(2, '0')}`
    return s + valor(k)
  }, 0)

  const maxValor = Math.max(...ANOS_HISTORICO.flatMap(ano =>
    MESES_ABREV.map((_, i) => valor(`${ano}-${String(i + 1).padStart(2, '0')}`))
  ), 1)

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Carregando histórico...</div>
  )

  const chartData = MESES_ABREV.map((m, i) => {
    const entry = { mes: m }
    ANOS_HISTORICO.forEach(ano => {
      entry[String(ano)] = valor(`${ano}-${String(i + 1).padStart(2, '0')}`)
    })
    return entry
  })

  const CORES_ANO = ['#a78bfa','#60a5fa','#34d399','#fbbf24','#f87171','#e879f9']

  // Máximo por mês (coluna) entre todos os anos
  const maxPorMes = MESES_ABREV.map((_, i) =>
    Math.max(...ANOS_HISTORICO.map(ano => valor(`${ano}-${String(i + 1).padStart(2, '0')}`)))
  )

  const fmtKAxis = (v) => {
    if (!v) return ''
    if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`
    return `R$${v.toFixed(0)}`
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-500">Faturamento Mensal por Ano</p>
          <div className="flex gap-1">
            {[{ key: 'linha', label: '〜 Linha' }, { key: 'barras', label: '▐ Barras' }].map(t => (
              <button key={t.key} onClick={() => setTipoGrafico(t.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${tipoGrafico === t.key ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          {tipoGrafico === 'linha' ? (
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtKAxis} tick={{ fontSize: 11 }} width={52} />
              <Tooltip formatter={(v) => fmtFull(v)} />
              <Legend />
              {ANOS_HISTORICO.map((ano, i) => (
                <Line key={ano} type="monotone" dataKey={String(ano)} name={String(ano)}
                  stroke={CORES_ANO[i % CORES_ANO.length]} strokeWidth={2} dot={{ r: 2 }} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtKAxis} tick={{ fontSize: 11 }} width={52} />
              <Tooltip formatter={(v) => fmtFull(v)} />
              <Legend />
              {ANOS_HISTORICO.map((ano, i) => (
                <Bar key={ano} dataKey={String(ano)} name={String(ano)}
                  fill={CORES_ANO[i % CORES_ANO.length]} radius={[2,2,0,0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <p className="text-xs text-gray-400">Clique em qualquer célula vazia para inserir o valor manualmente</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase sticky left-0 bg-gray-50 min-w-[60px]">Ano</th>
                {MESES_ABREV.map(m => (
                  <th key={m} className="px-2 py-3 text-center text-xs font-semibold text-gray-400 uppercase min-w-[80px]">{m}</th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase min-w-[100px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {ANOS_HISTORICO.map((ano) => {
                const total = totalAno(ano)
                return (
                  <tr key={ano} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-700 sticky left-0 bg-white">{ano}</td>
                    {MESES_ABREV.map((_, i) => {
                      const k = `${ano}-${String(i + 1).padStart(2, '0')}`
                      const v = valor(k)
                      const pct = maxValor > 0 ? v / maxValor : 0
                      const mesAtual = new Date().getFullYear() === ano && new Date().getMonth() === i
                      const manual = isManual(k)
                      const supa = fromSupa(k)
                      const editing = editando === k
                      const eMaior = v > 0 && v === maxPorMes[i]

                      return (
                        <td key={i} className={`px-1 py-2 text-center ${eMaior ? 'bg-green-50' : ''}`}>
                          {editing ? (
                            <input
                              autoFocus
                              value={editRaw}
                              onChange={e => setEditRaw(e.target.value)}
                              onBlur={() => commitEdit(k)}
                              onKeyDown={e => { if (e.key === 'Enter') commitEdit(k); if (e.key === 'Escape') { setEditando(null); setEditRaw('') } }}
                              placeholder="0"
                              className="w-16 text-xs text-center border border-brand-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-brand-200"
                            />
                          ) : v > 0 ? (
                            <div
                              className={`flex flex-col items-center gap-1 ${!supa ? 'cursor-pointer group/cell' : ''}`}
                              onClick={() => startEdit(k)}
                              title={!supa ? 'Clique para editar' : ''}
                            >
                              <span className={`text-xs font-semibold ${eMaior ? 'text-green-600' : mesAtual ? 'text-brand-600' : manual ? 'text-gray-500' : 'text-gray-700'}`}>
                                {fmtK(v)}
                                {manual && <span className="ml-0.5 text-gray-300 text-[9px]">✎</span>}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(k)}
                              className="text-gray-200 text-xs hover:text-gray-400 transition-colors w-full"
                              title="Inserir valor"
                            >—</button>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      {total > 0 ? fmtFull(total) : '—'}
                    </td>
                  </tr>
                )
              })}
              {ANOS_HISTORICO.length >= 2 && (() => {
                const anoAnt = ANOS_HISTORICO[ANOS_HISTORICO.length - 2]
                const anoAtl = ANOS_HISTORICO[ANOS_HISTORICO.length - 1]
                return (
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-4 py-2 text-xs font-semibold text-gray-400 sticky left-0 bg-gray-50">vs {anoAnt}</td>
                    {MESES_ABREV.map((_, i) => {
                      const ka = `${anoAnt}-${String(i + 1).padStart(2, '0')}`
                      const kb = `${anoAtl}-${String(i + 1).padStart(2, '0')}`
                      const va = valor(ka), vb = valor(kb)
                      if (!va || !vb) return <td key={i} className="px-2 py-2 text-center text-xs text-gray-300">—</td>
                      const diff = ((vb - va) / va) * 100
                      return (
                        <td key={i} className="px-2 py-2 text-center">
                          <span className={`text-xs font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(0)}%
                          </span>
                        </td>
                      )
                    })}
                    <td className="px-4 py-2 text-right">
                      {(() => {
                        const ta = totalAno(anoAnt), tb = totalAno(anoAtl)
                        if (!ta || !tb) return <span className="text-xs text-gray-300">—</span>
                        const d = ((tb - ta) / ta) * 100
                        return <span className={`text-xs font-bold ${d >= 0 ? 'text-green-600' : 'text-red-500'}`}>{d >= 0 ? '+' : ''}{d.toFixed(1)}%</span>
                      })()}
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Financeiro({ initialTab = 'financeiro' }) {
  const { clinicaId } = useAuth()
  const [abaAtiva, setAbaAtiva] = useState(initialTab)
  const {
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
  } = useFinanceiro()

  const { receitas: RECEITAS_KEYS, custos: CUSTOS_KEYS, despesas: DESPESAS_KEYS, investimentos: INVESTIMENTOS_KEYS, emprestimos: EMPRESTIMOS_KEYS } = categorias

  const chartData = resumoAnual.map((m, i) => ({
    ...m,
    acumulado: resultadoAcumulado[i],
  }))

  const resultColor = totais.resultado >= 0 ? 'text-green-600' : 'text-red-500'
  const resultBg = totais.resultado >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
        </div>
        {abaAtiva === 'financeiro' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAno(a => a - 1)}
              className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center text-sm"
            >←</button>
            <span className="text-sm font-bold text-gray-700 w-10 text-center">{ano}</span>
            <button
              onClick={() => setAno(a => a + 1)}
              className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center text-sm"
            >→</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 -mb-2">
        {[
          { key: 'financeiro', label: 'Financeiro' },
          { key: 'historico', label: 'Histórico' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setAbaAtiva(tab.key)}
            className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-px ${
              abaAtiva === tab.key
                ? 'border-brand-400 text-brand-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {abaAtiva === 'historico' && <Historico />}

      {abaAtiva === 'financeiro' && <>
      {/* Seletor de mês */}
      <div className="flex gap-1 flex-wrap">
        {MESES.map((m, i) => (
          <button
            key={i}
            onClick={() => setMes(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mes === i
                ? 'bg-brand-400 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Receita Total', value: totais.receita, color: 'text-green-600', bg: 'bg-green-50', icon: '💰' },
          { label: 'Custos', value: totais.custos, color: 'text-orange-600', bg: 'bg-orange-50', icon: '📦' },
          { label: 'Despesas', value: totais.despesas, color: 'text-red-500', bg: 'bg-red-50', icon: '💸' },
          { label: 'Investimentos', value: totais.investimentos, color: 'text-blue-600', bg: 'bg-blue-50', icon: '📈' },
          { label: 'Empréstimos', value: totais.emprestimos, color: 'text-purple-600', bg: 'bg-purple-50', icon: '🏦' },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} rounded-2xl p-4 border border-gray-100`}>
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
              <span className="text-base">{c.icon}</span>
            </div>
            <p className={`text-lg font-bold ${c.color}`}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Resultado do mês */}
      <div className={`rounded-2xl p-5 border ${resultBg} flex items-center justify-between`}>
        <div>
          <p className="text-sm text-gray-500 font-medium">Resultado de {MESES_FULL[mes]} {ano}</p>
          <p className={`text-3xl font-bold mt-1 ${resultColor}`}>{fmt(totais.resultado)}</p>
        </div>
        <div className="text-right text-sm text-gray-500 space-y-1">
          <p>Total de saídas: <span className="font-semibold text-gray-700">{fmt(totais.totalSaidas)}</span></p>
          <p>Receita: <span className="font-semibold text-green-600">{fmt(totais.receita)}</span></p>
        </div>
      </div>

      {/* Seções de lançamento */}
      <div className="space-y-4">
        <Secao
          titulo="Receitas"
          cor="green"
          icon="💰"
          keys={RECEITAS_KEYS}
          ocultosList={ocultos.receitas || []}
          categoria="receitas"
          dados={dadosMes.receitas}
          setValor={setValor}
          total={totais.receita}
          onAdd={addItem}
          onRemove={removeItem}
          onToggleOculto={toggleOculto}
        />
        <Secao
          titulo="Custos (Insumos / Produtos)"
          cor="orange"
          icon="📦"
          keys={CUSTOS_KEYS}
          ocultosList={ocultos.custos || []}
          categoria="custos"
          dados={dadosMes.custos}
          setValor={setValor}
          total={totais.custos}
          onAdd={addItem}
          onRemove={removeItem}
          onToggleOculto={toggleOculto}
        />
        <Secao
          titulo="Despesas Operacionais"
          cor="red"
          icon="💸"
          keys={DESPESAS_KEYS}
          ocultosList={ocultos.despesas || []}
          categoria="despesas"
          dados={dadosMes.despesas}
          setValor={setValor}
          total={totais.despesas}
          onAdd={addItem}
          onRemove={removeItem}
          onToggleOculto={toggleOculto}
        />
        <Secao
          titulo="Investimentos"
          cor="blue"
          icon="📈"
          keys={INVESTIMENTOS_KEYS}
          ocultosList={ocultos.investimentos || []}
          categoria="investimentos"
          dados={dadosMes.investimentos}
          setValor={setValor}
          total={totais.investimentos}
          onAdd={addItem}
          onRemove={removeItem}
          onToggleOculto={toggleOculto}
        />
        <Secao
          titulo="Pagamentos de Empréstimos"
          cor="purple"
          icon="🏦"
          keys={EMPRESTIMOS_KEYS}
          ocultosList={ocultos.emprestimos || []}
          categoria="emprestimos"
          dados={dadosMes.emprestimos}
          setValor={setValor}
          total={totais.emprestimos}
          onAdd={addItem}
          onRemove={removeItem}
          onToggleOculto={toggleOculto}
        />
      </div>

      {/* Tabela resumo anual */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Resumo Anual {ano}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Categoria</th>
                {MESES.map(m => <th key={m} className="px-3 py-3 text-right">{m}</th>)}
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Receita Total', key: 'receita', color: 'text-green-600 font-semibold' },
                { label: 'Custos', key: 'saidas', color: 'text-orange-600' },
                { label: 'Resultado Mensal', key: 'resultado', color: '', resultado: true },
                { label: 'Resultado Acumulado', key: 'acumulado', color: '', acumulado: true },
              ].map((row, ri) => {
                const total = row.acumulado
                  ? resultadoAcumulado[11]
                  : chartData.reduce((acc, m) => acc + (m[row.key] || 0), 0)
                return (
                  <tr key={ri} className={`border-t border-gray-50 ${row.resultado || row.acumulado ? 'bg-gray-50 font-semibold' : ''}`}>
                    <td className="px-4 py-3 text-gray-700">{row.label}</td>
                    {chartData.map((m, i) => {
                      const v = row.acumulado ? resultadoAcumulado[i] : m[row.key]
                      const color = row.resultado || row.acumulado
                        ? v >= 0 ? 'text-green-600' : 'text-red-500'
                        : row.color
                      return (
                        <td key={i} className={`px-3 py-3 text-right ${color} whitespace-nowrap`}>
                          {fmtShort(v)}
                        </td>
                      )
                    })}
                    <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                      row.resultado || row.acumulado
                        ? total >= 0 ? 'text-green-600' : 'text-red-500'
                        : row.color
                    }`}>
                      {fmtShort(total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Receita x Saídas por Mês</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="receita" name="Receita" fill="#34d399" radius={[4,4,0,0]} />
              <Bar dataKey="saidas" name="Saídas" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Resultado Acumulado no Ano</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Acumulado"
                stroke="#f472b6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="resultado"
                name="Mensal"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="4 2"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      </>}
    </div>
  )
}
