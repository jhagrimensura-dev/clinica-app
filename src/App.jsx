import { useState } from 'react'
import { ClinicaProvider } from './context/ClinicaContext'
import { FinanceiroProvider } from './context/FinanceiroContext'
import { ContasProvider } from './context/ContasContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Metas from './pages/Metas'
import SocialMedia from './pages/SocialMedia'
import Comercial from './pages/Comercial'
import Recorrencia from './pages/Recorrencia'
import Faturamento from './pages/Faturamento'
import Financeiro from './pages/Financeiro'
import ContasPagar from './pages/ContasPagar'
import Pacientes from './pages/Pacientes'
import Relatorios from './pages/Relatorios'

function PagePlaceholder({ title }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
        Em construção... 🚧
      </div>
    </div>
  )
}

function Diario({ mesIndex, ano }) {
  const mesesNome = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const diasMaio = [
    { dia: 1, semana: 'Qui', leads: 4, contatos: 8, atend: 2, fat: 'R$ 6.400', status: 'ok' },
    { dia: 2, semana: 'Sex', leads: 6, contatos: 12, atend: 3, fat: 'R$ 9.600', status: 'ok' },
    { dia: 5, semana: 'Seg', leads: 3, contatos: 7, atend: 2, fat: 'R$ 6.400', status: 'ok' },
    { dia: 6, semana: 'Ter', leads: 5, contatos: 10, atend: 3, fat: 'R$ 9.600', status: 'ok' },
    { dia: 7, semana: 'Qua', leads: 7, contatos: 14, atend: 4, fat: 'R$ 12.800', status: 'ok' },
    { dia: 8, semana: 'Qui', leads: 2, contatos: 5, atend: 1, fat: 'R$ 3.200', status: 'baixo' },
    { dia: 9, semana: 'Sex', leads: 8, contatos: 16, atend: 3, fat: 'R$ 9.600', status: 'ok' },
    { dia: 12, semana: 'Seg', leads: 5, contatos: 9, atend: 2, fat: 'R$ 6.400', status: 'ok' },
    { dia: 13, semana: 'Ter', leads: 4, contatos: 8, atend: 1, fat: 'R$ 3.200', status: 'baixo' },
    { dia: 14, semana: 'Qua', leads: 6, contatos: 11, atend: 2, fat: 'R$ 6.400', status: 'ok' },
    { dia: 15, semana: 'Qui', leads: 5, contatos: 10, atend: 3, fat: 'R$ 9.600', status: 'ok' },
    { dia: 16, semana: 'Sex', leads: 9, contatos: 18, atend: 5, fat: 'R$ 16.000', status: 'alto' },
    { dia: 19, semana: 'Seg', leads: 7, contatos: 13, atend: 3, fat: 'R$ 9.600', status: 'ok' },
    { dia: 20, semana: 'Ter', leads: 6, contatos: 12, atend: 2, fat: 'R$ 6.400', status: 'ok' },
    { dia: 21, semana: 'Qua', leads: 4, contatos: 8, atend: 2, fat: 'R$ 6.400', status: 'ok' },
  ]
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Visão Diária</h1>
        <p className="text-sm text-gray-400 mt-1">Detalhamento por dia — {mesesNome[mesIndex]} de {ano}</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total de Leads', value: '59', icon: '🔗', color: 'text-pink-500' },
          { label: 'Atendimentos', value: '24', icon: '📅', color: 'text-blue-500' },
          { label: 'Vendas', value: '21', icon: '✅', color: 'text-green-500' },
          { label: 'Faturamento', value: 'R$ 61.749', icon: '💰', color: 'text-purple-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-gray-500">{card.label}</p>
              <span className={`text-lg ${card.color}`}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Dias de Atendimento — {mesesNome[mesIndex]}</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">15 dias úteis</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              {['Dia','Leads','Contatos','Atendimentos','Faturamento','Status'].map(h => (
                <th key={h} className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diasMaio.map((d, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-pink-50 transition-colors">
                <td className="px-6 py-3">
                  <span className="font-bold text-sm text-gray-800">{d.dia}</span>
                  <span className="text-xs text-gray-400 ml-2">{d.semana}</span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">{d.leads}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{d.contatos}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{d.atend}</td>
                <td className="px-6 py-3 text-sm font-semibold text-gray-800">{d.fat}</td>
                <td className="px-6 py-3">
                  {d.status === 'alto' && <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-1 rounded-full">🔥 Alto</span>}
                  {d.status === 'ok' && <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-1 rounded-full">✅ Normal</span>}
                  {d.status === 'baixo' && <span className="text-xs bg-red-100 text-red-500 font-semibold px-2 py-1 rounded-full">⚠️ Baixo</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [view, setView] = useState('mensal')
  const [mesIndex, setMesIndex] = useState(4)
  const ano = 2026

  const renderPage = () => {
    if (view === 'diario') return <Diario mesIndex={mesIndex} ano={ano} />
    switch (active) {
      case 'dashboard': return <Dashboard />
      case 'metas': return <Metas />
      case 'social': return <SocialMedia />
      case 'comercial': return <Comercial />
      case 'recorrencia': return <Recorrencia />
      case 'faturamento': return <Faturamento />
      case 'financeiro': return <Financeiro />
      case 'contas': return <ContasPagar />
      case 'pacientes': return <Pacientes />
      case 'relatorios': return <Relatorios />
      default: return <Dashboard />
    }
  }

  return (
    <ClinicaProvider>
    <FinanceiroProvider>
    <ContasProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar active={active} setActive={setActive} />
        <div className="flex-1 ml-52 flex flex-col">
          <Header view={view} setView={setView} />
          <main className="flex-1">{renderPage()}</main>
        </div>
      </div>
    </ContasProvider>
    </FinanceiroProvider>
    </ClinicaProvider>
  )
}
