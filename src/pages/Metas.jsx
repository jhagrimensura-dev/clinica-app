import { useState } from 'react'

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
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())

  const [metaValor, setMetaValor] = useState(200000)
  const [editando, setEditando] = useState(false)
  const [inputValor, setInputValor] = useState('')

  const [superMetaValor, setSuperMetaValor] = useState(null)
  const [editandoSuper, setEditandoSuper] = useState(false)
  const [inputSuperValor, setInputSuperValor] = useState('')

  const [recordeValor, setRecordeValor] = useState(142500)
  const [editandoRecorde, setEditandoRecorde] = useState(false)
  const [inputRecordeValor, setInputRecordeValor] = useState('')

  const [diasSelecionados, setDiasSelecionados] = useState(() => new Set())
  const [diasValores, setDiasValores] = useState({})
  const [diaEditando, setDiaEditando] = useState(null)
  const [inputTempValor, setInputTempValor] = useState('')

  const calendario = gerarCalendario(ano, mes)

  const navMes = (delta) => {
    const novoMes = mes + delta
    if (novoMes < 0) { setMes(11); setAno(a => a - 1) }
    else if (novoMes > 11) { setMes(0); setAno(a => a + 1) }
    else setMes(novoMes)
    setDiasSelecionados(new Set())
    setDiasValores({})
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

  const superMeta = superMetaValor ?? metaValor * 1.1
  const diasAtendimento = diasSelecionados.size
  const metaDiariaOriginal = diasAtendimento > 0 ? metaValor / diasAtendimento : 0

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const iniciarEdicao = () => { setInputValor(String(metaValor)); setEditando(true) }
  const salvarEdicao = () => {
    const valor = parseFloat(inputValor.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(valor) && valor > 0) setMetaValor(valor)
    setEditando(false)
  }
  const handleKeyDown = (e) => { if (e.key === 'Enter') salvarEdicao(); if (e.key === 'Escape') setEditando(false) }

  const iniciarEdicaoSuper = () => { setInputSuperValor(String(superMeta)); setEditandoSuper(true) }
  const salvarEdicaoSuper = () => {
    const valor = parseFloat(inputSuperValor.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(valor) && valor > 0) setSuperMetaValor(valor)
    setEditandoSuper(false)
  }
  const handleKeyDownSuper = (e) => { if (e.key === 'Enter') salvarEdicaoSuper(); if (e.key === 'Escape') setEditandoSuper(false) }

  const iniciarEdicaoRecorde = () => { setInputRecordeValor(String(recordeValor)); setEditandoRecorde(true) }
  const salvarEdicaoRecorde = () => {
    const valor = parseFloat(inputRecordeValor.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(valor) && valor > 0) setRecordeValor(valor)
    setEditandoRecorde(false)
  }
  const handleKeyDownRecorde = (e) => { if (e.key === 'Enter') salvarEdicaoRecorde(); if (e.key === 'Escape') setEditandoRecorde(false) }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Metas</h1>
        <p className="text-sm text-gray-400 mt-1">Defina metas mensais e distribua objetivos por dias úteis</p>
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
                  className="flex-1 text-2xl font-bold text-gray-900 border-b-2 border-pink-400 outline-none bg-transparent w-full" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={salvarEdicao} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Salvar</button>
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
            <span className="text-pink-400">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{diasAtendimento}</p>
          <p className="text-xs text-gray-400 mt-1">dias selecionados</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Meta Diária</p>
            <span className="text-pink-400">📊</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{diasAtendimento > 0 ? fmt(metaDiariaOriginal) : '—'}</p>
          <p className="text-xs text-gray-400 mt-1">por dia de atendimento</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Mês</p>
            <span className="text-orange-400">📆</span>
          </div>
          <p className="text-xl font-bold text-gray-900 capitalize">{MESES[mes]}</p>
          <p className="text-xs text-gray-400 mt-1">{ano}</p>
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

              const valorNum = diasValores[key]
              const temValor = valorNum !== undefined && valorNum !== null

              const bg = !isSelected
                ? 'bg-white border border-gray-100'
                : !temValor
                  ? 'bg-yellow-50 border border-yellow-200'
                  : valorNum >= metaDiariaOriginal
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
                      {diaEditando === key ? (
                        <div onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            type="number"
                            value={inputTempValor}
                            onChange={e => setInputTempValor(e.target.value)}
                            onFocus={e => e.target.select()}
                            onBlur={() => salvarEdicaoValor(key)}
                            onKeyDown={e => { if (e.key === 'Enter') salvarEdicaoValor(key); if (e.key === 'Escape') setDiaEditando(null) }}
                            className="w-full text-sm font-bold outline-none bg-transparent border-b border-gray-400"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <p
                          className="text-sm font-bold text-gray-800 cursor-text"
                          onClick={e => iniciarEdicaoValor(e, key)}
                        >
                          {temValor ? valorNum.toLocaleString('pt-BR') : <span className="text-gray-300 text-xs font-normal">—</span>}
                        </p>
                      )}
                      {metaDiariaOriginal > 0 && (
                        <p className="text-xs text-gray-400">/{Math.round(metaDiariaOriginal).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-200"></div><span className="text-xs text-gray-500">Selecionado</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-300"></div><span className="text-xs text-gray-500">Meta batida</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-300"></div><span className="text-xs text-gray-500">Abaixo da meta</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200"></div><span className="text-xs text-gray-500">Não selecionado</span></div>
        </div>
      </div>

    </div>
  )
}
