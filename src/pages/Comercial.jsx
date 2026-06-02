export default function Comercial() {
  const semanas = [
    [{ dia: 26, mes: 'ant' }, { dia: 27, mes: 'ant' }, { dia: 28, mes: 'ant' }, { dia: 29, mes: 'ant' }, { dia: 30, mes: 'ant' }, { dia: 1 }, { dia: 2 }],
    [{ dia: 3 }, { dia: 4 }, { dia: 5 }, { dia: 6 }, { dia: 7 }, { dia: 8 }, { dia: 9 }],
    [{ dia: 10 }, { dia: 11 }, { dia: 12 }, { dia: 13 }, { dia: 14 }, { dia: 15 }, { dia: 16 }],
    [{ dia: 17 }, { dia: 18 }, { dia: 19 }, { dia: 20 }, { dia: 21 }, { dia: 22 }, { dia: 23 }],
    [{ dia: 24 }, { dia: 25 }, { dia: 26 }, { dia: 27 }, { dia: 28 }, { dia: 29 }, { dia: 30 }],
    [{ dia: 31 }, { dia: 1, mes: 'prox' }, { dia: 2, mes: 'prox' }, { dia: 3, mes: 'prox' }, { dia: 4, mes: 'prox' }, { dia: 5, mes: 'prox' }, { dia: 6, mes: 'prox' }],
  ]

  const agendamentos = [
    { dia: 1, nome: 'Maria S.', tipo: 'Avaliação', cor: 'bg-blue-100 text-blue-700' },
    { dia: 3, nome: 'João P.', tipo: 'Retorno', cor: 'bg-green-100 text-green-700' },
    { dia: 5, nome: 'Ana L.', tipo: 'Avaliação', cor: 'bg-blue-100 text-blue-700' },
    { dia: 8, nome: 'Carlos M.', tipo: 'Fechamento', cor: 'bg-pink-100 text-pink-700' },
    { dia: 10, nome: 'Paula R.', tipo: 'Avaliação', cor: 'bg-blue-100 text-blue-700' },
    { dia: 12, nome: 'Lucas T.', tipo: 'Retorno', cor: 'bg-green-100 text-green-700' },
    { dia: 15, nome: 'Fernanda K.', tipo: 'Fechamento', cor: 'bg-pink-100 text-pink-700' },
    { dia: 17, nome: 'Bruno A.', tipo: 'Avaliação', cor: 'bg-blue-100 text-blue-700' },
    { dia: 19, nome: 'Camila F.', tipo: 'Avaliação', cor: 'bg-blue-100 text-blue-700' },
    { dia: 22, nome: 'Rafael N.', tipo: 'Fechamento', cor: 'bg-pink-100 text-pink-700' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">WhatsApp</h1>
          <p className="text-sm text-gray-400 mt-1">Acompanhe agendamentos, conversões e fechamentos</p>
        </div>
        <button className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          + Novo Agendamento
        </button>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Leads Recebidos</p>
          <p className="text-2xl font-bold text-gray-900">59</p>
          <p className="text-xs text-gray-400 mt-1">Total do mês</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Avaliações</p>
          <p className="text-2xl font-bold text-gray-900">38</p>
          <p className="text-xs text-gray-400 mt-1">64,4% dos leads</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Fechamentos</p>
          <p className="text-2xl font-bold text-gray-900">23</p>
          <p className="text-xs text-gray-400 mt-1">60,5% das avaliações</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Conversão Geral</p>
          <p className="text-2xl font-bold text-pink-500">12,88%</p>
          <p className="text-xs text-gray-400 mt-1">Leads → Fechamentos</p>
        </div>
      </div>

      {/* Funil */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4">Funil Comercial</h2>
        <div className="space-y-3">
          {[
            { label: 'Leads Recebidos', valor: 59, total: 59, cor: 'bg-pink-400' },
            { label: 'Contatos Realizados', valor: 45, total: 59, cor: 'bg-purple-400' },
            { label: 'Avaliações Agendadas', valor: 38, total: 59, cor: 'bg-blue-400' },
            { label: 'Avaliações Realizadas', valor: 30, total: 59, cor: 'bg-cyan-400' },
            { label: 'Fechamentos', valor: 23, total: 59, cor: 'bg-green-400' },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-semibold text-gray-800">{item.valor}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`${item.cor} h-3 rounded-full transition-all`}
                  style={{ width: `${(item.valor / item.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-1">Calendário Comercial</h2>
        <p className="text-xs text-gray-400 mb-4">Agendamentos do mês</p>

        <div className="grid grid-cols-7 mb-2">
          {['DOM','SEG','TER','QUA','QUI','SEX','SAB'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {semanas.map((semana, si) => (
          <div key={si} className="grid grid-cols-7 border-t border-gray-100">
            {semana.map((celula, ci) => {
              const isMesAtual = !celula.mes
              const eventos = agendamentos.filter(a => a.dia === celula.dia && isMesAtual)
              return (
                <div
                  key={ci}
                  className={`min-h-[80px] p-2 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-pink-50 transition-colors ${!isMesAtual ? 'bg-gray-50' : ''}`}
                >
                  <span className={`text-xs font-bold ${isMesAtual ? 'text-gray-700' : 'text-gray-300'}`}>
                    {celula.dia}
                  </span>
                  <div className="space-y-1 mt-1">
                    {eventos.map((ev, ei) => (
                      <div key={ei} className={`text-xs px-2 py-0.5 rounded-md font-medium ${ev.cor}`}>
                        {ev.tipo}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

