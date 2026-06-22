import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import { ClinicaProvider } from './context/ClinicaContext'
import { FinanceiroProvider } from './context/FinanceiroContext'
import { ContasProvider } from './context/ContasContext'
import { LeadsProvider } from './context/LeadsContext'
import { PacientesProvider } from './context/PacientesContext'
import { VendasProvider } from './context/VendasContext'
import LeadsNovos from './pages/LeadsNovos'
import LeadsRecorrentes from './pages/LeadsRecorrentes'
import Indicacao from './pages/Indicacao'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Metas from './pages/Metas'
import SocialMedia from './pages/SocialMedia'
import Comercial from './pages/Comercial'
import Recorrencia from './pages/Recorrencia'
import Faturamento from './pages/Faturamento'
import Financeiro from './pages/Financeiro'
import ContasPagar from './pages/ContasPagar'
import Pacientes from './pages/Pacientes'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Ajuda from './pages/Ajuda'
import InboxWhatsApp from './pages/InboxWhatsApp'
import AgendaLembretes from './pages/AgendaLembretes'
import WhatsAppFAB from './components/WhatsAppFAB'

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
  const diasMaio = []
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Visão Diária</h1>
        <p className="text-sm text-gray-400 mt-1">Detalhamento por dia — {mesesNome[mesIndex]} de {ano}</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total de Leads', value: '0', icon: '🔗', color: 'text-brand-500' },
          { label: 'Atendimentos', value: '0', icon: '📅', color: 'text-blue-500' },
          { label: 'Vendas', value: '0', icon: '✅', color: 'text-green-500' },
          { label: 'Faturamento', value: 'R$ 0', icon: '💰', color: 'text-purple-500' },
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
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">0 dias úteis</span>
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
              <tr key={i} className="border-t border-gray-50 hover:bg-brand-50 transition-colors">
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

function DefinirSenha() {
  const { updatePassword, session } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    if (senha !== confirma) { setErro('As senhas não coincidem.'); return }
    setErro(''); setLoading(true)
    const { error } = await updatePassword(senha)
    if (error) { setLoading(false); setErro('Erro ao definir senha. Tente novamente.'); return }
    // Limpa o flag needsPassword — session vai atualizar via onAuthStateChange
    await import('./lib/supabase').then(({ supabase }) =>
      supabase.auth.updateUser({ data: { needsPassword: false, passwordSet: true } })
    )
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-200 rounded-2xl flex items-center justify-center text-brand-600 font-bold text-2xl mx-auto mb-4">A</div>
          <h1 className="text-2xl font-bold text-gray-800">Bem-vindo!</h1>
          <p className="text-sm text-gray-400 mt-1">{session?.user?.email}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-1">Defina sua senha</h2>
          <p className="text-xs text-gray-400 mb-5">Crie uma senha para acessar o sistema nas próximas vezes.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nova senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirmar senha</label>
              <input type="password" value={confirma} onChange={e => setConfirma(e.target.value)} required placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            {erro && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-400 hover:bg-brand-500 disabled:bg-brand-200 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
              {loading ? 'Salvando...' : 'Definir senha e entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function AppInner() {
  const { session, recoveryMode, primeiroAcesso } = useAuth()

  if (session === undefined) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )
  if (!session || recoveryMode) return <Login />
  if (primeiroAcesso) return <DefinirSenha />
  return <AppContent />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

const PAGE_PARENT = { agenda_lembretes: 'comercial', leads_novos: 'comercial', leads_recorrentes: 'comercial', indicacao: 'comercial', contas: 'financeiro' }

function AppContent() {
  const { userRole, permissoes } = useAuth()
  const [active, setActiveRaw] = useState('dashboard')

  const podeAcessar = (page) => {
    if (userRole !== 'Funcionário') return true
    if (page === 'configuracoes') return false
    if (permissoes) {
      const check = PAGE_PARENT[page] || page
      return permissoes.includes(check)
    }
    return !['financeiro', 'contas'].includes(page)
  }

  const setActive = (page) => {
    if (!podeAcessar(page)) return
    setActiveRaw(page)
  }

  useEffect(() => {
    const handler = () => setActiveRaw('inbox')
    window.addEventListener('navegarInbox', handler)
    return () => window.removeEventListener('navegarInbox', handler)
  }, [])
  const [view, setView] = useState('mensal')
  const [mesIndex, setMesIndex] = useState(4)
  const [collapsed] = useState(false)
  const ano = 2026

  const renderPage = () => {
    if (view === 'diario') return <Diario mesIndex={mesIndex} ano={ano} />
    if (active.startsWith('inbox_')) return <InboxWhatsApp contaId={active.replace('inbox_', '')} />
    switch (active) {
      case 'dashboard': return <Dashboard />
      case 'agenda': return <Agenda />
      case 'metas': return <Metas />
      case 'social': return <SocialMedia />
      case 'inbox': return <InboxWhatsApp />
      case 'comercial': return <Comercial />
      case 'agenda_lembretes': return <AgendaLembretes />
      case 'leads_novos': return <LeadsNovos />
      case 'leads_recorrentes': return <LeadsRecorrentes />
      case 'indicacao': return <Indicacao />
case 'whatsapp_canal': return <PagePlaceholder title="WhatsApp" />
      case 'recorrencia': return <Recorrencia />
      case 'faturamento': return <Faturamento />
      case 'financeiro': return <Financeiro />
      case 'contas': return <ContasPagar />
      case 'pacientes': return <Pacientes />
      case 'relatorios': return <Relatorios />
      case 'configuracoes': return <Configuracoes />
      case 'ajuda': return <Ajuda />
      default: return <Dashboard />
    }
  }

  return (
    <ClinicaProvider>
    <FinanceiroProvider>
    <ContasProvider>
    <LeadsProvider>
    <PacientesProvider>
    <VendasProvider>
      <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #F5EDE0 0%, #EDD9C0 50%, #E8D4BE 100%)' }}>
        <Sidebar active={active} setActive={setActive} />
        <div className="flex-1 ml-16 flex flex-col">
          {active === 'dashboard' && <Header view={view} setView={setView} />}
          <main className="flex-1">{renderPage()}</main>
        </div>
        {active !== 'inbox' && !active.startsWith('inbox_') && (
          <WhatsAppFAB onOpen={() => setActive('inbox')} />
        )}
      </div>
    </VendasProvider>
    </PacientesProvider>
    </LeadsProvider>
    </ContasProvider>
    </FinanceiroProvider>
    </ClinicaProvider>
  )
}
