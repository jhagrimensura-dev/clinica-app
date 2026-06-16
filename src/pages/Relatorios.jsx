export default function Relatorios() {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  const faturamento = [28000, 32000, 35000, 30000, 38450, 0]
  const leads = [42, 38, 51, 45, 59, 0]
  const maxFat = Math.max(...faturamento)
  const maxLeads = Math.max(...leads)

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        </div>
        <button className="bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          Exportar PDF
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Faturamento Acumulado</p>
          <p className="text-2xl font-bold text-gray-900">R$ 163.450</p>
          <p className="text-xs text-gray-400 mt-1">Jan — Mai 2025</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Total de Leads</p>
          <p className="text-2xl font-bold text-gray-900">235</p>
          <p className="text-xs text-gray-400 mt-1">Jan — Mai 2025</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Novos Pacientes</p>
          <p className="text-2xl font-bold text-gray-900">98</p>
          <p className="text-xs text-gray-400 mt-1">Jan — Mai 2025</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Conversão Média</p>
          <p className="text-2xl font-bold text-brand-500">11,4%</p>
          <p className="text-xs text-gray-400 mt-1">Jan — Mai 2025</p>
        </div>
      </div>

      {/* Gráfico Faturamento */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-6">Faturamento Mensal</h2>
        <div className="flex items-end gap-4 h-48">
          {meses.map((mes, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">
                {faturamento[i] > 0 ? `R$ ${(faturamento[i] / 1000).toFixed(0)}k` : ''}
              </span>
              <div className="w-full flex items-end justify-center" style={{ height: '140px' }}>
                <div
                  className={`w-full rounded-t-xl transition-all ${i === 4 ? 'bg-brand-400' : 'bg-brand-200'}`}
                  style={{ height: faturamento[i] > 0 ? `${(faturamento[i] / maxFat) * 140}px` : '4px' }}
                ></div>
              </div>
              <span className="text-xs text-gray-400 font-medium">{mes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico Leads */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-6">Leads por Mês</h2>
        <div className="flex items-end gap-4 h-48">
          {meses.map((mes, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">
                {leads[i] > 0 ? leads[i] : ''}
              </span>
              <div className="w-full flex items-end justify-center" style={{ height: '140px' }}>
                <div
                  className={`w-full rounded-t-xl transition-all ${i === 4 ? 'bg-purple-400' : 'bg-purple-200'}`}
                  style={{ height: leads[i] > 0 ? `${(leads[i] / maxLeads) * 140}px` : '4px' }}
                ></div>
              </div>
              <span className="text-xs text-gray-400 font-medium">{mes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela resumo mensal */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4">Resumo Mensal</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-semibold">Mês</th>
              <th className="pb-3 font-semibold">Faturamento</th>
              <th className="pb-3 font-semibold">Leads</th>
              <th className="pb-3 font-semibold">Novos Pacientes</th>
              <th className="pb-3 font-semibold">Conversão</th>
            </tr>
          </thead>
          <tbody>
            {[
              { mes: 'Janeiro', fat: 28000, leads: 42, pac: 15, conv: '10,2%' },
              { mes: 'Fevereiro', fat: 32000, leads: 38, pac: 18, conv: '11,8%' },
              { mes: 'Março', fat: 35000, leads: 51, pac: 22, conv: '12,1%' },
              { mes: 'Abril', fat: 30000, leads: 45, pac: 20, conv: '11,1%' },
              { mes: 'Maio', fat: 38450, leads: 59, pac: 23, conv: '12,88%' },
            ].map((row, i) => (
              <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === 4 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                <td className="py-3">{row.mes}</td>
                <td className="py-3">R$ {row.fat.toLocaleString('pt-BR')}</td>
                <td className="py-3">{row.leads}</td>
                <td className="py-3">{row.pac}</td>
                <td className="py-3 text-brand-500 font-semibold">{row.conv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

