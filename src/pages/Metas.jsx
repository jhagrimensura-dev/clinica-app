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
              <p className="text-sm font-semibold text-gray-700">Meta</p>
            </div>
            <button className="text-gray-300 hover:text-gray-500 text-sm">✏️</button>
          </div>
          <p className="text-3xl font-bold text-gray-900">R$ 200.000,00</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-500 text-lg">📈</span>
            <p className="text-sm font-semibold text-gray-700">Super Meta</p>
          </div>
          <p className="text-3xl font-bold text-green-500">R$ 220.000,00</p>
          <p className="text-xs text-gray-400 mt-1">+10% da meta principal</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-orange-400 text-lg">🏆</span>
            <p className="text-sm font-semibold text-gray-700">Recorde Mensal</p>
          </div>
          <p className="text-3xl font-bold text-orange-400">R$ 142.500,00</p>
          <p className="text-xs text-gray-400 mt-1">maior faturamento histórico</p>
        </div>
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Dias de Atendimento</p>
            <span className="text-pink-400">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">15</p>
          <p className="text-xs text-gray-400 mt-1">dias selecionados</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Meta Diária Original</p>
            <span className="text-pink-400">📊</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">R$ 13.333,33</p>
          <p className="text-xs text-gray-400 mt-1">por dia útil</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500">Meta Diária Ajustada</p>
            <span className="text-orange-400">🔥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">R$ 20.335,82</p>
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
