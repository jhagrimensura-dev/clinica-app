import { useState } from 'react'
import { useClinica } from '../context/ClinicaContext'
import { useVendas } from '../context/VendasContext'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function gerarCalendario(ano, mes) {
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const diasMesAnterior = new Date(ano, mes, 0).getDate()

  const semanas = []
  let semana = []

  for (let i = primeiroDia - 1; i >= 0; i--) {
    semana.push({ dia: diasMesAnterior - i, mes: 'ant' })
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    semana.push({ dia })
    if (semana.length === 7) {
      semanas.push(semana)
      semana = []
    }
  }

  if (semana.length > 0) {
    let prox = 1
    while (semana.length < 7) semana.push({ dia: prox++, mes: 'prox' })
    semanas.push(semana)
  }

  return semanas
}

export default function Metas() {
  const {
    ano, setAno, mes, setMes,
    metaValor, setMetaValor,
    superMetaValor, setSuperMetaValor,
    recordeValor, setRecordeValor,
    diasSelecionados, setDiasSelecionados,
    diasValores, setDiasValores,
    superMeta, diasAtendimento, metaDiaria,
  } = useClinica()

  const [editando, setEditando] = useState(false)
  const [inputValor, setInputValor] = useState('')

  const [editandoSuper, setEditandoSuper] = useState(false)
  const [inputSuperValor, setInputSuperValor] = useState('')

  const [editandoRecorde, setEditandoRecorde] = useState(false)
  const [inputRecordeValor, setInputRecordeValor] = useState('')

  const [diaEditando, setDiaEditando] = useState(null)
  const [inputTempValor, setInputTempValor] = useState('')

  const calendario = gerarCalendario(ano, mes)

  const navMes = (delta) => {
    const novoMes = mes + delta
    if (novoMes < 0) { setMes(11); setAno(a => a - 1) }
    else if (novoMes > 11) { setMes(0); setAno(a => a + 1) }
    else setMes(novoMes)
    setDiaEditando(null)
  }

  const iniciarEdicaoValor = (e, key) => {
    e.stopPropagation()
    setDiaEditando(key)
    setInputTempValor(diasValores[key] !== undefined ? String(diasValores[key]) : '')
  }

  const salvarEdicaoValor = (key) => {
    const num = parseFloat(String(inputTempValor).replace(/\./g, '').replace(',', '.'))
    if (!isNaN(num) && num >= 0) setDiasValores(prev => ({ ...prev, [key]: num }))
    else if (inputTempValor === '') setDiasValores(prev => { const n = { ...prev }; delete n[key]; return n })
    setDiaEditando(null)
  }

  const toggleDia = (si, di) => {
    const dia = calendario[si][di]
    if (dia.mes) return
    const key = `${si}-${di}`
    setDiasSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const { lancamentos } = useVendas()

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const vendasPorDia = lancamentos
    .filter(l => l.data.startsWith(prefix))
    .reduce((acc, l) => {
      const dia = parseInt(l.data.split('-')[2], 10)
      acc[dia] = (acc[dia] || 0) + (l.valorTratamento || 0) + (l.valorTaxa || 0)
      return acc
    }, {})

  const metaDiariaOriginal = metaDiaria

  const diasOrdenados = []
  calendario.forEach((semana, si) => {
    semana.forEach((dia, di) => {
      if (!dia.mes && diasSelecionados.has(`${si}-${di}`)) {
        diasOrdenados.push({ key: `${si}-${di}`, dia: dia.dia })
      }
    })
  })
  diasOrdenados.sort((a, b) => a.dia - b.dia)

  const hoje = new Date()
  const diaHoje = (hoje.getFullYear() === ano && hoje.getMonth() === mes) ? hoje.getDate() : Infinity

  // Meta Diária Ajustada: redistribui nos dias restantes o que falta para bater a meta
  const diasPassados = diasOrdenados.filter(d => d.dia < diaHoje)
  const diasRestantes = diasOrdenados.filter(d => d.dia >= diaHoje)
  const totalVendasPassadas = diasPassados.reduce((acc, d) => acc + (vendasPorDia[d.dia] || 0), 0)
  const faltaParaMeta = Math.max(metaValor - totalVendasPassadas, 0)
  const metaDiariaAjustada = diasRestantes.length > 0 ? faltaParaMeta / diasRestantes.length : 0

  const metaDinamicaPorDia = {}
  const metaBase = diasOrdenados.length > 0 ? metaValor / diasOrdenados.length : 0
  diasOrdenados.forEach(({ dia }) => { metaDinamicaPorDia[dia] = metaBase })

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const parseValorInput = (str) => parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.')) || 0

  const iniciarEdicao = () => { setInputValor(String(Math.round(metaValor))); setEditando(true) }
  const salvarEdicao = () => {
    const valor = parseValorInput(inputValor)
    if (valor > 0) setMetaValor(valor)
    setEditando(false)
  }
  const handleKeyDown = (e) => { if (e.key === 'Enter') salvarEdicao(); if (e.key === 'Escape') setEditando(false) }

  const iniciarEdicaoSuper = () => { setInputSuperValor(String(Math.round(superMeta))); setEditandoSuper(true) }
  const salvarEdicaoSuper = () => {
    const valor = parseValorInput(inputSuperValor)
    if (valor > 0) setSuperMetaValor(valor)
    setEditandoSuper(false)
  }
  const handleKeyDownSuper = (e) => { if (e.key === 'Enter') salvarEdicaoSuper(); if (e.key === 'Escape') setEditandoSuper(false) }

  const iniciarEdicaoRecorde = () => { setInputRecordeValor(String(Math.round(recordeValor))); setEditandoRecorde(true) }
  const salvarEdicaoRecorde = () => {
    const valor = parseValorInput(inputRecordeValor)
    if (valor > 0) setRecordeValor(valor)
    setEditandoRecorde(false)
  }
  const handleKeyDownRecorde = (e) => { if (e.key === 'Enter') salvarEdicaoRecorde(); if (e.key === 'Escape') setEditandoRecorde(false) }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Metas</h1>
        </div>
        <div className="flex items-center gap-1 border border-brand-200 rounded-xl px-3 py-1.5 bg-brand-50">
          <button onClick={() => navMes(-1)} className="text-brand-400 hover:text-brand-600 px-1">‹</button>
          <span className="text-sm font-semibold text-brand-600 w-28 text-center">{MESES[mes].slice(0,3)} {ano}</span>
          <button onClick={() => navMes(1)} className="text-brand-400 hover:text-brand-600 px-1">›</button>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-lg">🎯</span>
              <p className="text-sm font-semibold text-gray-700">Ideal</p>
            </div>
            {!editando && <button onClick={iniciarEdicao} className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>}
          </div>
          {editando ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-gray-500">R$</span>
                <input autoFocus type="text" value={inputValor} onChange={(e) => setInputValor(e.target.value)} onKeyDown={handleKeyDown}
                  className="flex-1 text-2xl font-bold text-gray-900 border-b-2 border-brand-400 outline-none bg-transparent w-full" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={salvarEdicao} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Salvar</button>
                <button onClick={() => setEditando(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{fmt(metaValor)}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">📈</span>
              <p className="text-sm font-semibold text-gray-700">Meta</p>
            </div>
            {!editandoSuper && <button onClick={iniciarEdicaoSuper} className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>}
          </div>
          {editandoSuper ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-gray-400">R$</span>
                <input autoFocus type="text" value={inputSuperValor} onChange={(e) => setInputSuperValor(e.target.value)} onKeyDown={handleKeyDownSuper}
                  className="flex-1 text-2xl font-bold text-green-500 border-b-2 border-green-400 outline-none bg-transparent w-full" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={salvarEdicaoSuper} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Salvar</button>
                <button onClick={() => setEditandoSuper(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-green-500">{fmt(superMeta)}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-orange-400 text-lg">🏆</span>
              <p className="text-sm font-semibold text-gray-700">Super Meta</p>
            </div>
            {!editandoRecorde && <button onClick={iniciarEdicaoRecorde} className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>}
          </div>
          {editandoRecorde ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-gray-400">R$</span>
                <input autoFocus type="text" value={inputRecordeValor} onChange={(e) => setInputRecordeValor(e.target.value)} onKeyDown={handleKeyDownRecorde}
                  className="flex-1 text-2xl font-bold text-orange-400 border-b-2 border-orange-400 outline-none bg-transparent w-full" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={salvarEdicaoRecorde} className="flex-1 bg-orange-400 hover:bg-orange-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Salvar</button>
                <button onClick={() => setEditandoRecorde(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-blue-500">{fmt(recordeValor)}</p>
          )}
        </div>
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Dias de Atendimento</p>
            <span className="text-brand-400">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{diasAtendimento}</p>
          <p className="text-xs text-gray-400 mt-1">dias selecionados</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Meta Diária Original</p>
            <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{diasAtendimento > 0 ? fmt(metaDiariaOriginal) : '—'}</p>
          <p className="text-xs text-gray-400 mt-1">por dia útil</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Meta Diária Ajustada</p>
            <span className="text-orange-400">📋</span>
          </div>
          <p className={`text-3xl font-bold ${metaDiariaAjustada > metaDiariaOriginal ? 'text-red-500' : 'text-green-600'}`}>
            {diasRestantes.length > 0 ? fmt(metaDiariaAjustada) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {diasRestantes.length > 0
              ? metaDiariaAjustada > metaDiariaOriginal ? 'acima do original — déficit' : 'compensando superávit'
              : 'sem dias restantes'}
          </p>
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Agenda</h2>
            <p className="text-xs text-gray-400 mt-1">Clique nos dias para marcar como dia de atendimento.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navMes(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">‹</button>
            <span className="text-sm font-semibold text-gray-700 w-32 text-center">{MESES[mes]} {ano}</span>
            <button onClick={() => navMes(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['DOM','SEG','TER','QUA','QUI','SEX','SAB'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {calendario.map((semana, si) => (
          <div key={si} className="grid grid-cols-7 gap-1 mb-1">
            {semana.map((dia, di) => {
              const isMesAtual = !dia.mes
              const key = `${si}-${di}`
              const isSelected = diasSelecionados.has(key)

              if (!isMesAtual) return <div key={di} className="min-h-[72px] rounded-xl p-2"><p className="text-sm font-bold text-gray-300">{dia.dia}</p></div>

              const valorVendas = vendasPorDia[dia.dia] || 0
              const temVendas = valorVendas > 0
              const metaDoDia = metaDinamicaPorDia[dia.dia] || metaDiariaOriginal
              const isFuturo = dia.dia >= diaHoje

              const bg = !isSelected
                ? 'bg-white border border-gray-100'
                : isFuturo
                  ? 'bg-blue-50 border border-blue-100'
                  : !temVendas
                    ? 'bg-yellow-50 border border-yellow-200'
                    : valorVendas >= metaDoDia
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'

              return (
                <div
                  key={di}
                  onClick={() => toggleDia(si, di)}
                  className={`rounded-xl p-2 min-h-[72px] ${bg} cursor-pointer transition-all`}
                >
                  <p className="text-sm font-bold text-gray-800">{dia.dia}</p>
                  {isSelected && (
                    <div className="mt-1">
                      <p className={`text-sm font-bold ${temVendas ? (valorVendas >= metaDoDia ? 'text-green-600' : 'text-red-500') : 'text-gray-400'}`}>
                        {temVendas ? valorVendas.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '—'}
                      </p>
                      {metaDoDia > 0 && (
                        <p className="text-xs text-gray-400">/{Math.round(metaDoDia).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-200"></div><span className="text-xs text-gray-500">Próximos dias</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-200"></div><span className="text-xs text-gray-500">Sem venda</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-300"></div><span className="text-xs text-gray-500">Meta batida</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-300"></div><span className="text-xs text-gray-500">Abaixo da meta</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200"></div><span className="text-xs text-gray-500">Não selecionado</span></div>
        </div>
      </div>

    </div>
  )
}
