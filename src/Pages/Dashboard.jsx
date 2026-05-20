export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Visão geral dos indicadores</p>
      </div>

      {/* LINHA 1 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Faturamento Total</p>
            <span className="text-pink-400 text-lg">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">R$ 61.749</p>
          <p className="text-xs text-gray-400 mb-2">Meta: R$ 200.000</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
            <div className="bg-pink-400 h-2 rounded-full" style={{ width: '30.9%' }}></div>
          </div>
          <p className="text-xs text-pink-500 font-medium mb-4">30.9% da meta</p>
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Novos</span>
              <span className="font-medium text-gray-800">R$ 22.400 <span className="text-pink-400 text-xs ml-1">36.3%</span></span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Recorrência</span>
              <span className="font-medium text-gray-800">R$ 37.549 <span className="text-pink-400 text-xs ml-1">60.8%</span></span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Dias de Atendimento</p>
            <span className="text-pink-400 text-lg">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">8 / 15</p>
          <div className="space-y-1 text-sm text-gray-500">
            <p>Dia original: R$ 13.333</p>
            <p>Dia ajustado: R$ 20.336</p>
            <p className="font-bold text-gray-800 mt-2">53% atendidos</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Vendas</p>
            <span className="text-pink-400 text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">21</p>
          <p className="text-sm text-gray-400">7 novos | 14 recorrentes</p>
        </div>
      </div>

      {/* TICKET MÉDIO */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Ticket Médio</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Geral', value: 'R$ 2.855', sub: '21 pacientes' },
            { label: 'Novos', value: 'R$ 3.200', sub: '7 pacientes novos' },
            { label: 'Recorrência', value: 'R$ 2.682', sub: '14 pacientes recorrentes' },
            { label: 'Diário', value: 'R$ 7.031', sub: 'Média de 8 dias úteis' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-2">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FUNIL DE CONVERSÃO */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Funil de Conversão</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Social Media', icon: '🔗', color: 'text-pink-500', value: '458', sub: 'seguidores', extras: ['59 leads recebidos', '12.88% conversão', 'R$ 83,15 custo/lead'] },
            { label: 'Comercial', icon: '🏢', color: 'text-blue-500', value: '85', sub: 'leads', extras: ['11 agendamentos', '12.9% conversão'] },
            { label: 'Recorrência', icon: '🔄', color: 'text-teal-500', value: '186', sub: 'contatos', extras: ['13 agendamentos', '7.0% conversão'] },
            { label: 'Vendas', icon: '📊', color: 'text-green-500', value: '24', sub: 'agendamentos atendidos', extras: ['21 vendas | 7 novos', '87.5% conversão', 'R$ 700,81 custo/venda'] },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                <span className={`text-lg ${card.color}`}>{card.icon}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-400 mb-3">{card.sub}</p>
              <div className="space-y-1">
                {card.extras.map((e, j) => (
                  <p key={j} className={`text-xs ${j === 1 ? 'text-red-400 font-medium' : 'text-gray-500'}`}>{e}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
