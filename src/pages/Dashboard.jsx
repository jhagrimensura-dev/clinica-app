import { useClinica } from '../context/ClinicaContext'
import { useVendas } from '../context/VendasContext'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useLeads } from '../context/LeadsContext'

export default function Dashboard() {
  const { metaValor, diasAtendimento, metaDiaria, posts } = useClinica()
  const { lancamentos } = useVendas()
  const { mes, ano } = useFinanceiro()
  const { getLeadsPorOrigem } = useLeads()

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const lMes = lancamentos.filter(l => l.data.startsWith(prefix))

  const totalGeral = lMes.reduce((acc, l) => acc + (l.valorTratamento || 0) + (l.valorTaxa || 0), 0)
  const totalNovos = lMes.filter(l => l.tipo === 'Novo').reduce((acc, l) => acc + (l.valorTratamento || 0) + (l.valorTaxa || 0), 0)
  const totalRecorrentes = lMes.filter(l => l.tipo === 'Recorrente').reduce((acc, l) => acc + (l.valorTratamento || 0) + (l.valorTaxa || 0), 0)
  const countNovos = lMes.filter(l => l.tipo === 'Novo').length
  const countRecorrentes = lMes.filter(l => l.tipo === 'Recorrente').length
  const ticketGeral = lMes.length > 0 ? totalGeral / lMes.length : 0
  const ticketNovos = countNovos > 0 ? totalNovos / countNovos : 0
  const ticketRecorrentes = countRecorrentes > 0 ? totalRecorrentes / countRecorrentes : 0
  const ticketDiario = diasAtendimento > 0 ? totalGeral / diasAtendimento : 0

  const pct = metaValor > 0 ? Math.min((totalGeral / metaValor) * 100, 100).toFixed(1) : '0.0'

  // Leads por origem
  const leadsNovos = getLeadsPorOrigem('leads_novos', ano, mes)
  const leadsRecorrentes = getLeadsPorOrigem('leads_recorrentes', ano, mes)
  const leadsIndicacao = getLeadsPorOrigem('indicacao', ano, mes)
  const totalLeads = leadsNovos.length + leadsIndicacao.length

  const agendNovos = leadsNovos.filter(l => l.status === 'agendado' || l.status === 'fechado').length
  const agendRecorrentes = leadsRecorrentes.filter(l => l.status === 'agendado' || l.status === 'fechado').length
  const agendIndicacao = leadsIndicacao.filter(l => l.status === 'agendado' || l.status === 'fechado').length
  const totalAgend = agendNovos + agendIndicacao

  const convComercial = totalLeads > 0 ? ((totalAgend / totalLeads) * 100).toFixed(1) : '0.0'
  const convRecorrencia = leadsRecorrentes.length > 0 ? ((agendRecorrentes / leadsRecorrentes.length) * 100).toFixed(1) : '0.0'

  // Social Media (localStorage)
  const seguidores = parseInt(localStorage.getItem(`social_seguidores_${ano}_${mes}`) || '0')
  const trafegoInvestido = parseFloat(localStorage.getItem(`social_trafego_${ano}_${mes}`) || '0')
  const totalPosts = posts.length
  const totalImpulsionados = posts.filter(p => p.impulsionado).length
  const custoLead = totalLeads > 0 && trafegoInvestido > 0 ? trafegoInvestido / totalLeads : 0

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
            <span className="text-brand-400 text-lg">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{fmt(totalGeral)}</p>
          <p className="text-xs text-gray-400 mb-2">Meta: {fmt(metaValor)}</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
            <div className="bg-brand-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
          </div>
          <p className="text-xs text-brand-500 font-medium mb-4">{pct}% da meta</p>
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Novos</span>
              <span className="font-medium text-gray-800">{fmt(totalNovos)} <span className="text-brand-400 text-xs ml-1">{countNovos} venda(s)</span></span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Recorrência</span>
              <span className="font-medium text-gray-800">{fmt(totalRecorrentes)} <span className="text-brand-400 text-xs ml-1">{countRecorrentes} venda(s)</span></span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Dias de Atendimento</p>
            <span className="text-brand-400 text-lg">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">{diasAtendimento}</p>
          <div className="space-y-1 text-sm text-gray-500">
            <p>Meta diária: {diasAtendimento > 0 ? fmt(metaDiaria) : '—'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Vendas</p>
            <span className="text-brand-400 text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">{lMes.length}</p>
          <p className="text-sm text-gray-400">{countNovos} novos · {countRecorrentes} recorrentes</p>
        </div>
      </div>

      {/* TICKET MÉDIO */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Ticket Médio</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Geral', value: fmt(ticketGeral), sub: `${lMes.length} lançamento(s)` },
            { label: 'Novos', value: fmt(ticketNovos), sub: `${countNovos} novo(s)` },
            { label: 'Recorrência', value: fmt(ticketRecorrentes), sub: `${countRecorrentes} recorrente(s)` },
            { label: 'Diário', value: fmt(ticketDiario), sub: `${diasAtendimento} dias úteis` },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-2">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SOCIAL MEDIA */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Social Media</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Seguidores',
              value: seguidores.toLocaleString('pt-BR'),
              icon: '👥',
              color: 'text-brand-500',
              sub: 'total de seguidores',
            },
            {
              label: 'Posts no Mês',
              value: String(totalPosts),
              icon: '📸',
              color: 'text-purple-500',
              sub: `${totalImpulsionados} impulsionado${totalImpulsionados !== 1 ? 's' : ''}`,
            },
            {
              label: 'Tráfego Investido',
              value: fmt(trafegoInvestido),
              icon: '💸',
              color: 'text-blue-500',
              sub: 'investimento do mês',
            },
            {
              label: 'Custo por Lead',
              value: custoLead > 0 ? fmt(custoLead) : '—',
              icon: '🎯',
              color: 'text-teal-500',
              sub: totalLeads > 0 ? `${totalLeads} leads recebidos` : 'sem leads no mês',
            },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                <span className={`text-lg ${card.color}`}>{card.icon}</span>
              </div>
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
            { label: 'Social Media', icon: '🔗', color: 'text-brand-500', value: String(seguidores.toLocaleString('pt-BR')), sub: 'seguidores', extras: [`${totalLeads} leads recebidos`, `${convComercial}% conversão`] },
            { label: 'Leads Novos', icon: '🏢', color: 'text-blue-500', value: String(totalLeads), sub: `leads (${leadsNovos.length} novos · ${leadsIndicacao.length} indicações)`, extras: [`${totalAgend} agendamentos`, `${convComercial}% conversão`] },
            { label: 'Leads Recorrência', icon: '🔄', color: 'text-teal-500', value: String(leadsRecorrentes.length), sub: 'contatos recorrentes', extras: [`${agendRecorrentes} agendamentos`, `${convRecorrencia}% conversão`] },
            { label: 'Vendas', icon: '📊', color: 'text-green-500', value: String(lMes.length), sub: 'lançamentos no mês', extras: [`${countNovos} novos · ${countRecorrentes} recorrentes`, lMes.length > 0 ? `${fmt(ticketGeral)} ticket médio` : '—'] },
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
                  <p key={j} className="text-xs text-gray-500">{e}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
