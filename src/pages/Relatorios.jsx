import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useVendas } from '../context/VendasContext'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtK(v) {
  if (v === 0) return 'R$ 0'
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
  return `R$ ${v}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.dataKey}</span>
          <span className="font-bold text-gray-900 ml-1">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Relatorios() {
  const { lancamentos } = useVendas()

  const dados = useMemo(() => {
    return MESES.map((mes, i) => {
      const total = (ano) => {
        const prefix = `${ano}-${String(i + 1).padStart(2, '0')}`
        return lancamentos
          .filter(l => l.data.startsWith(prefix) && l.tipo !== 'Paciente Modelo')
          .reduce((acc, l) => acc + (l.valorTratamento || 0) + (l.valorTaxa || 0), 0)
      }
      return { mes, '2025': total(2025), '2026': total(2026) }
    })
  }, [lancamentos])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <button className="bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
          Exportar PDF
        </button>
      </div>

      {/* Gráfico Faturamento */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-6">Faturamento</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={dados} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad2025" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(v) => <span style={{ color: '#6b7280', fontSize: 12 }}>{v}</span>}
              iconType="circle"
              iconSize={8}
            />
            <Area type="monotone" dataKey="2025" stroke="#6b7280" strokeWidth={2} fill="url(#grad2025)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="2026" stroke="#C9A96E" strokeWidth={2} fill="url(#grad2026)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
