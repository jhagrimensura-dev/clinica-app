export default function Faturamento() {
  const transacoes = []

  const totalPago = transacoes.filter(t => t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0)
  const totalPendente = transacoes.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0)

  const servicos = [
    { nome: 'Botox', valor: 2500, cor: 'bg-pink-400' },
    { nome: 'Preenchimento', valor: 3600, cor: 'bg-purple-400' },
    { nome: 'Skinbooster', valor: 1250, cor: 'bg-blue-400' },
    { nome: 'Fio de PDO', valor: 1800, cor: 'bg-cyan-400' },
  ]
  const totalServicos = servicos.reduce((acc, s) => acc + s.valor, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
          <p className="text-sm text-gray-400 mt-1">Receitas, pagamentos e desempenho financeiro</p>
        </div>
        <button className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          + Nova Transação
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Faturamento Total</p>
          <p className="text-2xl font-bold text-gray-900">R$ 38.450</p>
          <p className="text-xs text-gray-400 mt-1">Meta: R$ 45.000</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Recebido</p>
          <p className="text-2xl font-bold text-green-500">R$ {totalPago.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-1">Pagamentos confirmados</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Pendente</p>
          <p className="text-2xl font-bold text-yellow-500">R$ {totalPendente.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-1">Aguardando pagamento</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-pink-500">R$ 1.671</p>
          <p className="text-xs text-gray-400 mt-1">Por procedimento</p>
        </div>
      </div>

      {/* Meta + Serviços */}
      <div className="grid grid-cols-2 gap-4">
        {/* Meta do mês */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">Meta do Mês</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">R$ 38.450 de R$ 45.000</span>
            <span className="font-semibold text-pink-500">85,4%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
            <div className="bg-pink-400 h-4 rounded-full" style={{ width: '85.4%' }}></div>
          </div>
          <p className="text-xs text-gray-400">Faltam R$ 6.550 para bater a meta 🎯</p>
        </div>

        {/* Serviços */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">Receita por Serviço</h2>
          <div className="space-y-3">
            {servicos.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{s.nome}</span>
                  <span className="font-semibold text-gray-800">R$ {s.valor.toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${s.cor} h-2 rounded-full`} style={{ width: `${(s.valor / totalServicos) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de transações */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4">Transações do Mês</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-semibold">Data</th>
              <th className="pb-3 font-semibold">Paciente</th>
              <th className="pb-3 font-semibold">Serviço</th>
              <th className="pb-3 font-semibold">Valor</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 text-gray-500">{t.data}</td>
                <td className="py-3 font-medium text-gray-800">{t.paciente}</td>
                <td className="py-3 text-gray-500">{t.servico}</td>
                <td className="py-3 font-semibold text-gray-800">R$ {t.valor.toLocaleString('pt-BR')}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.cor}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

