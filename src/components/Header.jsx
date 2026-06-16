import { useClinica } from '../context/ClinicaContext'

const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const mesesNome = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const diasSemana = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']

export default function Header({ view, setView }) {
  const { mes, setMes, ano, setAno } = useClinica()
  const hoje = new Date()
  const dataFormatada = `${diasSemana[hoje.getDay()]}, ${hoje.getDate()} de ${mesesNome[hoje.getMonth()]} de ${hoje.getFullYear()}`

  const navMes = (delta) => {
    const novo = mes + delta
    if (novo < 0) { setMes(11); setAno(a => a - 1) }
    else if (novo > 11) { setMes(0); setAno(a => a + 1) }
    else setMes(novo)
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
      <div>
        <p className="text-sm font-semibold text-gray-800">Dra. Amanda Lima</p>
        <p className="text-xs text-gray-400">{dataFormatada}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setView('mensal')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === 'mensal' ? 'bg-brand-400 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📅 Mensal
          </button>
          <button
            onClick={() => setView('diario')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === 'diario' ? 'bg-brand-400 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Diário
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
          <button onClick={() => navMes(-1)} className="text-gray-400 hover:text-gray-700 font-bold">‹</button>
          <div className="text-center min-w-[50px]">
            <p className="text-sm font-semibold text-gray-800">{meses[mes]}</p>
            <p className="text-xs text-gray-400">{ano}</p>
          </div>
          <button onClick={() => navMes(1)} className="text-gray-400 hover:text-gray-700 font-bold">›</button>
        </div>
      </div>
    </div>
  )
}
