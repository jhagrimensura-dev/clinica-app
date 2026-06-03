import { useClinica } from '../context/ClinicaContext'

export default function Dashboard() {
  const { metaValor, faturamentoTotal, porcentagemMeta, diasAtendimento, metaDiaria } = useClinica()

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const pct = Math.min(porcentagemMeta, 100).toFixed(1)

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
          <p className="text-3xl font-bold text-gray-900 mb-1">{fmt(faturamentoTotal)}</p>
          <p className="text-xs text-gray-400 mb-2">Meta: {fmt(metaValor)}</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
            <div className="bg-pink-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
          </div>
          <p className="text-xs text-pink-500 font-medium mb-4">{pct}% da meta</p>
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Novos</span>
              <span className="font-medium text-gray-800">R$ 0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Recorrência</span>
              <span className="font-medium text-gray-800">R$ 0</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Dias de Atendimento</p>
            <span className="text-pink-400 text-lg">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">{diasAtendimento}</p>
          <div className="space-y-1 text-sm text-gray-500">
            <p>Meta diária: {diasAtendimento > 0 ? fmt(metaDiaria) : '—'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Vendas</p>
            <span className="text-pink-400 text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">0</p>
          <p className="text-sm text-gray-400">—</p>
        </div>
      </div>

      {/* TICKET MÉDIO */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Ticket Médio</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Geral', value: 'R$ 0', sub: '—' },
            { label: 'Novos', value: 'R$ 0', sub: '—' },
            { label: 'Recorrência', value: 'R$ 0', sub: '—' },
            { label: 'Diário', value: 'R$ 0', sub: '—' },
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
            { label: 'Social Media', icon: '🔗', color: 'text-pink-500', value: '0', sub: 'seguidores', extras: ['0 leads recebidos', '0% conversão', '—'] },
            { label: 'Comercial', icon: '🏢', color: 'text-blue-500', value: '0', sub: 'leads', extras: ['0 agendamentos', '0% conversão'] },
            { label: 'Recorrência', icon: '🔄', color: 'text-teal-500', value: '0', sub: 'contatos', extras: ['0 agendamentos', '0% conversão'] },
            { label: 'Vendas', icon: '📊', color: 'text-green-500', value: '0', sub: 'agendamentos atendidos', extras: ['0 vendas', '0% conversão', '—'] },
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
