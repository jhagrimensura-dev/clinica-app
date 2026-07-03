import { useState, useMemo, useEffect } from 'react'
import { useVendas } from '../context/VendasContext'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const SALARIO_BASE = 3000

// Bônus semanal — acumulam dentro da mesma semana
const TIERS_SEMANA = [
  { label: 'Aceitável', meta: 45000, bonus: 50 },
  { label: 'Ideal',     meta: 50000, bonus: 100 },
  { label: 'Super Meta',meta: 54450, bonus: 150 },
]

// Bônus mensal — acumulam
const TIERS_MES = [
  { label: 'Aceitável', meta: 180000, bonus: 300 },
  { label: 'Ideal',     meta: 200000, bonus: 500 },
  { label: 'Super Meta',meta: 217800, bonus: 800 },
]

// Bônus recorrência — acumulam
const TIERS_REC = [
  { label: 'Aceitável', meta: 72000,  bonus: 150 },
  { label: 'Ideal',     meta: 80000,  bonus: 250 },
  { label: 'Super Meta',meta: 87120,  bonus: 400 },
]

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const parseMoney = (s) => parseFloat((s || '0').replace(/\./g, '').replace(',', '.')) || 0

function calcBonusAcum(valor, tiers) {
  return tiers.reduce((acc, t) => valor >= t.meta ? acc + t.bonus : acc, 0)
}

function calcConversao(taxa, valorConsultas) {
  if (taxa < 10) return 0
  if (taxa < 15) return valorConsultas * 0.10
  if (taxa < 20) return valorConsultas * 0.15
  return valorConsultas * 0.20
}

function MoneyInput({ value, onChange, placeholder = 'R$ 0,00' }) {
  const [raw, setRaw] = useState(value ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '')
  const handleChange = (e) => {
    const s = e.target.value.replace(/[^\d,]/g, '')
    setRaw(s)
    onChange(parseMoney(s))
  }
  return (
    <input
      value={raw}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-300 bg-white"
    />
  )
}

function TierBadge({ valor, tiers }) {
  const hit = [...tiers].reverse().find(t => valor >= t.meta)
  if (!hit) return <span className="text-xs text-gray-400">Abaixo da meta</span>
  const color = hit.label === 'Super Meta' ? 'bg-purple-100 text-purple-700' : hit.label === 'Ideal' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{hit.label}</span>
}

function BonusLine({ label, valor, destaque }) {
  return (
    <div className={`flex justify-between items-center py-2 ${destaque ? 'border-t-2 border-brand-200 mt-1 pt-3' : 'border-t border-gray-100'}`}>
      <span className={`text-sm ${destaque ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm font-bold ${destaque ? 'text-brand-600 text-lg' : valor > 0 ? 'text-green-600' : 'text-gray-400'}`}>{fmt(valor)}</span>
    </div>
  )
}

const STORAGE_KEY = (mes, ano) => `colaboradoras_${ano}_${mes}`

function loadData(mes, ano) {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(mes, ano)) || 'null') } catch { return null }
}
function saveData(mes, ano, data) {
  localStorage.setItem(STORAGE_KEY(mes, ano), JSON.stringify(data))
}

const defaultState = () => ({
  semanas: [0, 0, 0, 0],
  fatMensal: 0,
  totalLeads: 0,
  leadsConvertidos: 0,
  valorConsultas: 0,
  fatRecorrencia: 0,
})

// Retorna qual semana do mês (1–4) um dia pertence
function semanaDoMes(dia) {
  if (dia <= 7)  return 0
  if (dia <= 14) return 1
  if (dia <= 21) return 2
  return 3
}

export default function Colaboradoras() {
  const { lancamentos } = useVendas()
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [refreshKey, setRefreshKey] = useState(0)

  const [dados, setDados] = useState(() => loadData(hoje.getMonth(), hoje.getFullYear()) || defaultState())

  // Vendas de pacientes novos agrupadas por semana do mês selecionado
  const vendasPorSemana = useMemo(() => {
    const totais = [0, 0, 0, 0]
    const prefixo = `${ano}-${String(mes + 1).padStart(2, '0')}-`
    lancamentos
      .filter(l => l.tipo === 'Novo' && l.data?.startsWith(prefixo) && !l.tipo?.includes('Modelo'))
      .forEach(l => {
        const dia = parseInt(l.data.slice(8, 10), 10)
        const idx = semanaDoMes(dia)
        totais[idx] += (l.valorTratamento || 0)
      })
    return totais
  }, [lancamentos, mes, ano])

  const trocarMes = (novoMes, novoAno) => {
    setMes(novoMes); setAno(novoAno)
    setDados(loadData(novoMes, novoAno) || defaultState())
  }

  const navMes = (delta) => {
    let nm = mes + delta, na = ano
    if (nm < 0) { nm = 11; na-- } else if (nm > 11) { nm = 0; na++ }
    trocarMes(nm, na)
  }

  const update = (patch) => {
    const next = { ...dados, ...patch }
    setDados(next)
    saveData(mes, ano, next)
  }

  const setSemana = (i, v) => {
    const s = [...dados.semanas]; s[i] = v
    update({ semanas: s })
  }

  // Cálculos
  const bonusSemanas = useMemo(() => dados.semanas.map(v => calcBonusAcum(v, TIERS_SEMANA)), [dados.semanas])
  const totalBonusSemanas = bonusSemanas.reduce((a, b) => a + b, 0)
  const bonusMensal = useMemo(() => calcBonusAcum(dados.fatMensal, TIERS_MES), [dados.fatMensal])
  const taxaConversao = dados.totalLeads > 0 ? (dados.leadsConvertidos / dados.totalLeads) * 100 : 0
  const bonusConversao = useMemo(() => calcConversao(taxaConversao, dados.valorConsultas), [taxaConversao, dados.valorConsultas])
  const bonusRecorrencia = useMemo(() => calcBonusAcum(dados.fatRecorrencia, TIERS_REC), [dados.fatRecorrencia])
  const totalFinal = SALARIO_BASE + totalBonusSemanas + bonusMensal + bonusConversao + bonusRecorrencia

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👩‍💼 Colaboradoras</h1>
          <p className="text-sm text-gray-400 mt-1">Cálculo de bonificação mensal</p>
        </div>
        {/* Navegação de mês */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <button onClick={() => navMes(-1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 text-lg">‹</button>
          <span className="text-sm font-bold text-gray-700 min-w-[130px] text-center">{MESES[mes]} {ano}</span>
          <button onClick={() => navMes(1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 text-lg">›</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Coluna esquerda: inputs */}
        <div className="col-span-2 space-y-5">

          {/* Semanas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">Bônus Semanais</h2>
              <button
                onClick={() => {
                  const next = { ...dados, semanas: [...vendasPorSemana] }
                  setDados(next)
                  saveData(mes, ano, next)
                  setRefreshKey(k => k + 1)
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>
                Puxar do sistema
              </button>
            </div>
            {vendasPorSemana.some(v => v > 0) && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-3 text-xs text-green-700">
                <span>✓</span>
                <span>Encontrado <strong>{fmt(vendasPorSemana.reduce((a,b)=>a+b,0))}</strong> em vendas de pacientes novos em {MESES[mes]}. Clique em "Puxar do sistema" para preencher.</span>
              </div>
            )}
            <div className="space-y-2">
              {dados.semanas.map((v, i) => {
                const pct = Math.min(100, TIERS_SEMANA[2].meta > 0 ? (v / TIERS_SEMANA[2].meta) * 100 : 0)
                return (
                  <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-600 w-16 flex-shrink-0">Semana {i + 1}</span>
                      <div className="w-36 flex-shrink-0">
                        <MoneyInput key={`s${i}-${refreshKey}`} value={v} onChange={val => setSemana(i, val)} />
                      </div>
                      <div className="flex gap-1 flex-1">
                        {TIERS_SEMANA.map(t => {
                          const atingida = v >= t.meta
                          return (
                            <div key={t.label} className={`flex-1 text-center rounded-lg px-1 py-1 border ${atingida ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                              <p className={`text-[9px] font-semibold leading-tight ${atingida ? 'text-green-600' : 'text-gray-400'}`}>{t.label === 'Super Meta' ? 'Super' : t.label}</p>
                              <p className={`text-[10px] font-bold ${atingida ? 'text-green-700' : 'text-gray-500'}`}>{(t.meta / 1000).toFixed(0)}k</p>
                            </div>
                          )
                        })}
                      </div>
                      <TierBadge valor={v} tiers={TIERS_SEMANA} />
                      <span className={`text-sm font-bold w-16 text-right flex-shrink-0 ${bonusSemanas[i] > 0 ? 'text-green-600' : 'text-gray-300'}`}>+{fmt(bonusSemanas[i])}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 pl-[76px]">
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div className="h-1 rounded-full bg-green-400 transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-400">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Meta Mensal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Bônus Mensal</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Faturamento total do mês</label>
                <MoneyInput value={dados.fatMensal} onChange={v => update({ fatMensal: v })} />
              </div>
              <div className="text-right flex-shrink-0">
                <TierBadge valor={dados.fatMensal} tiers={TIERS_MES} />
                <p className={`text-lg font-bold mt-1 ${bonusMensal > 0 ? 'text-green-600' : 'text-gray-300'}`}>+{fmt(bonusMensal)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
              {TIERS_MES.map(t => (
                <div key={t.label} className="text-center bg-gray-50 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 font-semibold">{t.label}</p>
                  <p className="text-xs font-bold text-gray-700">{fmt(t.meta)}</p>
                  <p className="text-xs text-green-600 font-semibold">+{fmt(t.bonus)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conversão */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-1">Bônus por Conversão</h2>
            <p className="text-xs text-gray-400 mb-4">% de leads que se tornaram pacientes × valor das consultas</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Total de leads</label>
                <input type="number" value={dados.totalLeads || ''} onChange={e => update({ totalLeads: Number(e.target.value) })}
                  placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Leads convertidos</label>
                <input type="number" value={dados.leadsConvertidos || ''} onChange={e => update({ leadsConvertidos: Number(e.target.value) })}
                  placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Valor das consultas</label>
                <MoneyInput value={dados.valorConsultas} onChange={v => update({ valorConsultas: v })} />
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Taxa de conversão:</span>
                <span className={`text-lg font-bold ${taxaConversao >= 20 ? 'text-purple-600' : taxaConversao >= 15 ? 'text-blue-600' : taxaConversao >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                  {taxaConversao.toFixed(1)}%
                </span>
                {taxaConversao >= 10 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${taxaConversao >= 20 ? 'bg-purple-100 text-purple-700' : taxaConversao >= 15 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {taxaConversao >= 20 ? '20% das consultas' : taxaConversao >= 15 ? '15% das consultas' : '10% das consultas'}
                  </span>
                )}
              </div>
              <span className={`text-lg font-bold ${bonusConversao > 0 ? 'text-green-600' : 'text-gray-300'}`}>+{fmt(bonusConversao)}</span>
            </div>
            {/* Tabela de referência */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { range: '0 – 10%', pct: 0, cor: 'text-gray-400' },
                { range: '10 – 15%', pct: 10, cor: 'text-green-600' },
                { range: '15 – 20%', pct: 15, cor: 'text-blue-600' },
                { range: '> 20%', pct: 20, cor: 'text-purple-600' },
              ].map(r => (
                <div key={r.range} className="text-center bg-gray-50 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 font-semibold">{r.range}</p>
                  <p className={`text-xs font-bold ${r.cor}`}>{r.pct === 0 ? 'Sem bônus' : `${r.pct}% consultas`}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recorrência */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Bônus Recorrência</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Faturamento de recorrentes</label>
                <MoneyInput value={dados.fatRecorrencia} onChange={v => update({ fatRecorrencia: v })} />
              </div>
              <div className="text-right flex-shrink-0">
                <TierBadge valor={dados.fatRecorrencia} tiers={TIERS_REC} />
                <p className={`text-lg font-bold mt-1 ${bonusRecorrencia > 0 ? 'text-green-600' : 'text-gray-300'}`}>+{fmt(bonusRecorrencia)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
              {TIERS_REC.map(t => (
                <div key={t.label} className="text-center bg-gray-50 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 font-semibold">{t.label}</p>
                  <p className="text-xs font-bold text-gray-700">{fmt(t.meta)}</p>
                  <p className="text-xs text-green-600 font-semibold">+{fmt(t.bonus)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna direita: resumo */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Resumo — {MESES[mes]}</h2>

            <BonusLine label="Salário base" valor={SALARIO_BASE} />

            <div className="mt-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-1">Bônus semanais</p>
              {dados.semanas.map((v, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-500">Semana {i + 1}</span>
                  <span className={`text-xs font-semibold ${bonusSemanas[i] > 0 ? 'text-green-600' : 'text-gray-300'}`}>+{fmt(bonusSemanas[i])}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-200 mt-1">
                <span className="text-xs font-bold text-gray-600">Subtotal semanas</span>
                <span className="text-xs font-bold text-green-600">+{fmt(totalBonusSemanas)}</span>
              </div>
            </div>

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-1">Bônus mensais</p>
            <BonusLine label="Meta mensal" valor={bonusMensal} />
            <BonusLine label="Conversão" valor={bonusConversao} />
            <BonusLine label="Recorrência" valor={bonusRecorrencia} />

            <BonusLine label="Total a pagar" valor={totalFinal} destaque />

            {/* Breakdown visual */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {[
                { label: 'Base', valor: SALARIO_BASE, cor: 'bg-gray-300' },
                { label: 'Semanas', valor: totalBonusSemanas, cor: 'bg-blue-400' },
                { label: 'Mensal', valor: bonusMensal, cor: 'bg-purple-400' },
                { label: 'Conversão', valor: bonusConversao, cor: 'bg-amber-400' },
                { label: 'Rec.', valor: bonusRecorrencia, cor: 'bg-green-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-gray-400 w-16 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${item.cor}`}
                      style={{ width: `${Math.min(100, totalFinal > 0 ? (item.valor / totalFinal) * 100 : 0)}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 w-16 text-right">{fmt(item.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
