import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts'
import { useFinanceiro, CATEGORIAS } from '../context/FinanceiroContext'

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

export default function Financeiro() {
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
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
          <p className="text-sm text-gray-400 mt-1">Controle de receitas, custos e resultado mensal</p>
        </div>
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
      </div>

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
      <div className="grid grid-cols-5 gap-3">
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
      <div className="grid grid-cols-2 gap-4">
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
    </div>
  )
}
