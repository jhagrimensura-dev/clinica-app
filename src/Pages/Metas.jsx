import { useState } from 'react'

const calendario = [
  [
    { dia: 26, mes: 'ant' }, { dia: 27, mes: 'ant' }, { dia: 28, mes: 'ant' }, { dia: 29, mes: 'ant' }, { dia: 30, mes: 'ant' }, { dia: 1, status: 'futuro' }, { dia: 2, status: 'futuro' }
  ],
  [
    { dia: 3 }, { dia: 4, status: 'abaixo', real: 2700, meta: 13333 }, { dia: 5 }, { dia: 6, status: 'abaixo', real: 7300, meta: 13333 }, { dia: 7, status: 'abaixo', real: 2500, meta: 13333 }, { dia: 8, status: 'futuro' }, { dia: 9, status: 'futuro' }
  ],
  [
    { dia: 10 }, { dia: 11, status: 'abaixo', real: 6500, meta: 13333 }, { dia: 12, status: 'abaixo', real: 11015, meta: 13333 }, { dia: 13, status: 'abaixo', real: 9434, meta: 13333 }, { dia: 14, status: 'abaixo', real: 7800, meta: 13333 }, { dia: 15, status: 'futuro' }, { dia: 16, status: 'futuro' }
  ],
  [
    { dia: 17 }, { dia: 18, status: 'abaixo', real: 10300, meta: 13333 }, { dia: 19, status: 'selecionado', real: 4100, meta: 20336 }, { dia: 20, status: 'futuro', meta: 20336 }, { dia: 21, status: 'futuro', meta: 20336 }, { dia: 22, status: 'futuro' }, { dia: 23, status: 'futuro' }
  ],
  [
    { dia: 24 }, { dia: 25, status: 'futuro', meta: 20336 }, { dia: 26, status: 'futuro', meta: 20336 }, { dia: 27, status: 'futuro', meta: 20336 }, { dia: 28, status: 'futuro', meta: 20336 }, { dia: 29, status: 'futuro' }, { dia: 30, status: 'futuro' }
  ],
  [
    { dia: 31 }, { dia: 1, mes: 'prox' }, { dia: 2, mes: 'prox' }, { dia: 3, mes: 'prox' }, { dia: 4, mes: 'prox' }, { dia: 5, mes: 'prox' }, { dia: 6, mes: 'prox' }
  ],
]

export default function Metas() {
  const [metaValor, setMetaValor] = useState(200000)
  const [editando, setEditando] = useState(false)
  const [inputValor, setInputValor] = useState('')

  const [superMetaValor, setSuperMetaValor] = useState(null)
  const [editandoSuper, setEditandoSuper] = useState(false)
  const [inputSuperValor, setInputSuperValor] = useState('')

  const [recordeValor, setRecordeValor] = useState(142500)
  const [editandoRecorde, setEditandoRecorde] = useState(false)
  const [inputRecordeValor, setInputRecordeValor] = useState('')

  const diasAtendimento = 15
  const superMeta = superMetaValor ?? metaValor * 1.1
  const metaDiariaOriginal = metaValor / diasAtendimento

  const realizado = calendario.flat().reduce((acc, dia) => {
    if (dia.status === 'abaixo' || dia.status === 'acima') return acc + (dia.real || 0)
    return acc
  }, 0)

  const diasRestantes = calendario.flat().filter(dia =>
    (dia.status === 'futuro' && dia.meta) || dia.status === 'selecionado'
  ).length

  const metaDiariaAjustada = diasRestantes > 0
    ? (metaValor - realizado) / diasRestantes
    : metaDiariaOriginal

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const iniciarEdicao = () => {
    setInputValor(String(metaValor))
    setEditando(true)
  }

  const salvarEdicao = () => {
    const limpo = inputValor.replace(/\./g, '').replace(',', '.')
    const valor = parseFloat(limpo)
    if (!isNaN(valor) && valor > 0) setMetaValor(valor)
    setEditando(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') salvarEdicao()
    if (e.key === 'Escape') setEditando(false)
  }

  const iniciarEdicaoSuper = () => {
    setInputSuperValor(String(superMeta))
    setEditandoSuper(true)
  }

  const salvarEdicaoSuper = () => {
    const limpo = inputSuperValor.replace(/\./g, '').replace(',', '.')
    const valor = parseFloat(limpo)
    if (!isNaN(valor) && valor > 0) setSuperMetaValor(valor)
    setEditandoSuper(false)
  }

  const handleKeyDownSuper = (e) => {
    if (e.key === 'Enter') salvarEdicaoSuper()
    if (e.key === 'Escape') setEditandoSuper(false)
  }

  const iniciarEdicaoRecorde = () => {
    setInputRecordeValor(String(recordeValor))
    setEditandoRecorde(true)
  }

  const salvarEdicaoRecorde = () => {
    const limpo = inputRecordeValor.replace(/\./g, '').replace(',', '.')
    const valor = parseFloat(limpo)
    if (!isNaN(valor) && valor > 0) setRecordeValor(valor)
    setEditandoRecorde(false)
  }

  const handleKeyDownRecorde = (e) => {
    if (e.key === 'Enter') salvarEdicaoRecorde()
    if (e.key === 'Escape') setEditandoRecorde(false)
  }

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
            {!editando && (
              <button onClick={iniciarEdicao} className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>
            )}
          </div>
          {editando ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-gray-500">R$</span>
                <input
                  autoFocus
                  type="text"
                  value={inputValor}
                  onChange={(e) => setInputValor(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-2xl font-bold text-gray-900 border-b-2 border-pink-400 outline-none bg-transparent w-full"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={salvarEdicao}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditando(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
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
            {!editandoSuper && (
              <button onClick={iniciarEdicaoSuper} className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>
            )}
          </div>
          {editandoSuper ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-gray-400">R$</span>
                <input
                  autoFocus
                  type="text"
                  value={inputSuperValor}
                  onChange={(e) => setInputSuperValor(e.target.value)}
                  onKeyDown={handleKeyDownSuper}
                  className="flex-1 text-2xl font-bold text-green-500 border-b-2 border-green-400 outline-none bg-transparent w-full"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={salvarEdicaoSuper}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditandoSuper(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-green-500">{fmt(superMeta)}</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-orange-400 text-lg">🏆</span>
              <p className="text-sm font-semibold text-gray-700">Super Meta</p>
            </div>
            {!editandoRecorde && (
              <button onClick={iniciarEdicaoRecorde} className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>
            )}
          </div>
          {editandoRecorde ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-gray-400">R$</span>
                <input
                  autoFocus
                  type="text"
                  value={inputRecordeValor}
                  onChange={(e) => setInputRecordeValor(e.target.value)}
                  onKeyDown={handleKeyDownRecorde}
                  className="flex-1 text-2xl font-bold text-orange-400 border-b-2 border-orange-400 outline-none bg-transparent w-full"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={salvarEdicaoRecorde}
                  className="flex-1 bg-orange-400 hover:bg-orange-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditandoRecorde(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-blue-500">{fmt(recordeValor)}</p>
            </>
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
            <p className="text-sm text-gray-500">Meta Diária Original</p>
            <span className="text-pink-400">📊</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmt(metaDiariaOriginal)}</p>
          <p className="text-xs text-gray-400 mt-1">por dia útil</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Meta Diária Ajustada</p>
            <span className="text-orange-400">🔥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmt(metaDiariaAjustada)}</p>
          <p className="text-xs text-gray-400 mt-1">compensando déficit</p>
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-800">Agenda</h2>
          <p className="text-xs text-gray-400 mt-1">Selecione os dias de agenda aberta e acompanhe as metas diárias.</p>
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
              const bg =
                dia.status === 'selecionado' ? 'bg-yellow-100 border border-yellow-300' :
                dia.status === 'abaixo' ? 'bg-red-50 border border-red-200' :
                dia.status === 'acima' ? 'bg-green-50 border border-green-200' :
                dia.status === 'futuro' && dia.meta ? 'bg-pink-50 border border-pink-200' :
                'bg-white border border-gray-100'

              return (
                <div key={di} className={`rounded-xl p-2 min-h-[60px] ${bg} ${!isMesAtual ? 'opacity-30' : ''}`}>
                  <p className={`text-xs font-bold ${isMesAtual ? 'text-gray-700' : 'text-gray-400'}`}>{dia.dia}</p>
                  {dia.real && <p className="text-xs text-gray-600 mt-1 font-medium">{dia.real.toLocaleString('pt-BR')}</p>}
                  {dia.meta && <p className="text-xs text-gray-400">{dia.meta.toLocaleString('pt-BR')}</p>}
                </div>
              )
            })}
          </div>
        ))}

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-300"></div><span className="text-xs text-gray-500">Dia atual</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400"></div><span className="text-xs text-gray-500">Acima da meta</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div><span className="text-xs text-gray-500">Abaixo da meta</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-300"></div><span className="text-xs text-gray-500">Futuros selecionados</span></div>
        </div>
      </div>

    </div>
  )
}
