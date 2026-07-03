import { useVendas } from '../context/VendasContext'
import { useFinanceiro } from '../context/FinanceiroContext'

const isConsulta = (l) => (l.procedimentos || '').toLowerCase().trim() === 'consulta'

export default function Relatorios() {
  const { lancamentos } = useVendas()
  const { mes, ano } = useFinanceiro()

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const lMes = lancamentos.filter(l => l.data.startsWith(prefix) && l.tipo !== 'Paciente Modelo' && !isConsulta(l))

  const novos      = lMes.filter(l => l.tipo === 'Novo')
  const recorrentes = lMes.filter(l => l.tipo === 'Recorrência')
  const indicacao  = lMes.filter(l => l.tipo === 'Indicação')

  const totalNovos      = novos.reduce((a, l) => a + (l.valorTratamento || 0), 0)
  const totalRecorrentes = recorrentes.reduce((a, l) => a + (l.valorTratamento || 0), 0)
  const totalIndicacao  = indicacao.reduce((a, l) => a + (l.valorTratamento || 0), 0)
  const totalGeral = totalNovos + totalRecorrentes + totalIndicacao

  const fmt = (v) => v >= 1000
    ? `R$ ${(v / 1000).toFixed(1)}k`
    : `R$ ${v.toLocaleString('pt-BR')}`

  const barras = [
    { label: 'Novos',       valor: totalNovos,       count: novos.length,       cor: 'bg-brand-400',  corLight: 'bg-brand-200',  texto: 'text-brand-600'  },
    { label: 'Recorrência', valor: totalRecorrentes,  count: recorrentes.length, cor: 'bg-blue-400',   corLight: 'bg-blue-200',   texto: 'text-blue-600'   },
    { label: 'Indicação',   valor: totalIndicacao,   count: indicacao.length,   cor: 'bg-purple-400', corLight: 'bg-purple-200', texto: 'text-purple-600' },
  ]
  const maxValor = Math.max(...barras.map(b => b.valor), 1)

  const nomeMes = new Date(ano, mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  const faturamento = [28000, 32000, 35000, 30000, 38450, 0]
  const leads = [42, 38, 51, 45, 59, 0]
  const maxFat = Math.max(...faturamento)
  const maxLeads = Math.max(...leads)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <button className="bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          Exportar PDF
        </button>
      </div>

      {/* Gráfico Vendas por Tipo */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-gray-800">Vendas por Tipo</h2>
          <span className="text-xs text-gray-400 font-medium">{nomeMes}</span>
        </div>
        <div className="flex items-end gap-6 h-48">
          {barras.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-center">
                <p className={`text-sm font-bold ${b.texto}`}>{fmt(b.valor)}</p>
                <p className="text-xs text-gray-400">{b.count} venda{b.count !== 1 ? 's' : ''}</p>
              </div>
              <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                <div
                  className={`w-full rounded-t-xl transition-all ${b.valor > 0 ? b.cor : b.corLight}`}
                  style={{ height: b.valor > 0 ? `${(b.valor / maxValor) * 120}px` : '4px' }}
                />
              </div>
              <span className="text-xs text-gray-500 font-semibold">{b.label}</span>
            </div>
          ))}
        </div>
        {totalGeral > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-gray-900">{fmt(totalGeral)} · {lMes.length} vendas</span>
          </div>
        )}
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
                />
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
                />
              </div>
              <span className="text-xs text-gray-400 font-medium">{mes}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
