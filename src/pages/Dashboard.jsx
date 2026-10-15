import { useEffect, useState } from 'react'
import { useClinica } from '../context/ClinicaContext'
import { useVendas } from '../context/VendasContext'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useLeads } from '../context/LeadsContext'
import { useSocial } from '../context/SocialContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { metaValor, diasAtendimento, metaDiaria } = useClinica()
  const { lancamentos } = useVendas()
  const { mes, ano, MESES } = useFinanceiro()
  const { leads, getLeadsPorOrigem } = useLeads()
  const { getMes, carregarMes } = useSocial()
  const { clinicaId } = useAuth()

  const [planilhaRows, setPlanilhaRows] = useState([])

  useEffect(() => { carregarMes(ano, mes) }, [ano, mes])

  useEffect(() => {
    if (!clinicaId) return
    const monthStart = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
    const nextMonth = mes === 11
      ? `${ano + 1}-01-01`
      : `${ano}-${String(mes + 2).padStart(2, '0')}-01`
    supabase.from('planilha_leads')
      .select('nome, origem, agendou, compareceu, vendeu, reagendado')
      .eq('clinica_id', clinicaId)
      .gte('data', monthStart)
      .lt('data', nextMonth)
      .then(({ data }) => setPlanilhaRows(data || []))
  }, [clinicaId, mes, ano])

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const prefix = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const lMes = lancamentos.filter(l => l.data && l.data.startsWith(prefix))
  const isConsulta = (l) => (l.procedimentos || '').toLowerCase().trim() === 'consulta'
  // lMesSemConsulta → CONTAGENS e TICKET (consultas não são "vendas")
  // lMesValidos     → VALOR TOTAL (inclui valorTaxa das consultas)
  const lMesSemConsulta = lMes.filter(l => !isConsulta(l) && l.tipo !== 'Paciente Modelo')
  const lMesValidos = lMes.filter(l => l.tipo !== 'Paciente Modelo')

  const totalGeral = lMesValidos.reduce((acc, l) => acc + (l.valorTratamento || 0) + (l.valorTaxa || 0), 0)
  const totalNovos = lMesSemConsulta.filter(l => l.tipo === 'Novo').reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const totalNovoFollow = lMesSemConsulta.filter(l => l.tipo === 'Novo Follow').reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const totalRecorrentes = lMesSemConsulta.filter(l => l.tipo === 'Recorrência').reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const totalIndicacaoLanc = lMesSemConsulta.filter(l => l.tipo === 'Indicação').reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const countNovos = lMesSemConsulta.filter(l => l.tipo === 'Novo').length
  const countNovoFollow = lMesSemConsulta.filter(l => l.tipo === 'Novo Follow').length
  const countRecorrentes = lMesSemConsulta.filter(l => l.tipo === 'Recorrência').length
  const countIndicacaoLanc = lMesSemConsulta.filter(l => l.tipo === 'Indicação').length
  const lConsultas = lMesValidos.filter(l => isConsulta(l))
  const totalConsultas = lConsultas.reduce((acc, l) => acc + (l.valorTaxa || 0), 0)
  const countConsultas = lConsultas.length
  const ticketGeral = lMesValidos.length > 0 ? totalGeral / lMesValidos.length : 0
  const ticketNovos = (countNovos + countIndicacaoLanc) > 0 ? (totalNovos + totalIndicacaoLanc) / (countNovos + countIndicacaoLanc) : 0
  const ticketRecorrentes = countRecorrentes > 0 ? totalRecorrentes / countRecorrentes : 0
  const ticketIndicacao = countIndicacaoLanc > 0 ? totalIndicacaoLanc / countIndicacaoLanc : 0
  const ticketDiario = diasAtendimento > 0 ? totalGeral / diasAtendimento : 0

  const pct = metaValor > 0 ? Math.min((totalGeral / metaValor) * 100, 100).toFixed(1) : '0.0'

  // Leads por origem
  const leadsNovos = getLeadsPorOrigem('leads_novos', ano, mes)
  const leadsRecorrentes = getLeadsPorOrigem('leads_recorrentes', ano, mes)
  const leadsIndicacao = getLeadsPorOrigem('indicacao', ano, mes)
  const totalLeads = leadsNovos.length + leadsIndicacao.length

  const isFollowLead = l => {
    const dataRef = l.dataOrigem || l.data || ''
    if (dataRef && !dataRef.startsWith(prefix)) return true
    return String(l.fonte || '').toLowerCase().includes('follow') || String(l.origemCustom || '').toLowerCase().includes('follow')
  }
  const leadsNovosReais = leadsNovos.filter(l => !isFollowLead(l)).length
  const agendRecorrentes = leadsRecorrentes.filter(l => l.status === 'agendado' || l.status === 'fechado').length

  // Leads Follow Up (nova página dedicada)
  const leadsFollowUp = getLeadsPorOrigem('leads_followup', ano, mes)
  const fuEmAberto = leadsFollowUp.filter(l => l.status === 'em_aberto').length
  const fuRespondeu = leadsFollowUp.filter(l => l.status === 'conversando').length
  const fuAgendado = leadsFollowUp.filter(l => l.status === 'agendado').length
  const fuVendido = leadsFollowUp.filter(l => l.status === 'fechado').length
  const convFollow = leadsFollowUp.length > 0
    ? (((fuAgendado + fuVendido) / leadsFollowUp.length) * 100).toFixed(1)
    : '0.0'

  // CAC só conta novos clientes via tráfego pago — consultas tipo Novo no Faturamento
  const cacClientes = lConsultas.filter(l => l.tipo === 'Novo').length

  // Agendados = planilha_leads.agendou (quem marcou consulta)
  const planilhaAgendados = planilhaRows.filter(r => r.agendou)
  const agendadosNovos = planilhaAgendados.filter(r => r.origem !== 'Indicação').length
  const agendadosIndicacao = planilhaAgendados.filter(r => r.origem === 'Indicação').length
  const totalAgendNovos = planilhaAgendados.length

  // Conversão na cadeira:
  // - reagendado sem venda = ainda indeciso → fora do denominador
  // - reagendado com venda = converteu, procedimento no próximo mês → conta normalmente
  const cadeiraCompareceu = planilhaRows.filter(r => r.compareceu && (!r.reagendado || r.vendeu)).length
  const cadeiraVendeu = planilhaRows.filter(r => r.compareceu && r.vendeu).length
  const convCadeira = cadeiraCompareceu > 0
    ? `${((cadeiraVendeu / cadeiraCompareceu) * 100).toFixed(0)}%`
    : '—'

  // Taxa geral: só novos + indicação (não conta Recorrência nem outros tipos)
  const convComercial = totalLeads > 0 ? ((totalAgendNovos / totalLeads) * 100).toFixed(1) : '0.0'
  const convNovos = (leadsNovosReais + leadsIndicacao.length) > 0 ? ((totalAgendNovos / (leadsNovosReais + leadsIndicacao.length)) * 100).toFixed(1) : '0.0'
  const convRecorrencia = leadsRecorrentes.length > 0 ? ((agendRecorrentes / leadsRecorrentes.length) * 100).toFixed(1) : '0.0'

  const { trafego: trafegoInvestido, seguidores } = getMes(ano, mes)
  const custoLead = leadsNovosReais > 0 && trafegoInvestido > 0 ? trafegoInvestido / leadsNovosReais : 0
  const custoPorSeguidor = seguidores > 0 && trafegoInvestido > 0 ? trafegoInvestido / seguidores : 0

  const [sincronizando, setSincronizando] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  async function sincronizar() {
    setSincronizando(true)
    setSyncMsg(null)
    try {
      const res = await fetch(`/api/sync-planilha?mes=${mes + 1}&ano=${ano}`)
      const data = await res.json()
      if (data.ok) {
        setSyncMsg(`✓ ${data.resultado.novos} novos · ${data.resultado.followup} follow-ups · ${data.resultado.recorrentes} recorrentes`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setSyncMsg('Erro ao sincronizar')
        setSincronizando(false)
      }
    } catch {
      setSyncMsg('Erro ao sincronizar')
      setSincronizando(false)
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2">
          {syncMsg && <span className="text-xs text-green-600 font-medium">{syncMsg}</span>}
          <button
            onClick={sincronizar}
            disabled={sincronizando}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {sincronizando ? 'Sincronizando…' : 'Sincronizar Planilhas'}
          </button>
        </div>
      </div>

      {/* LINHA 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="pt-2 border-t border-gray-100" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', columnGap: '0.5rem', rowGap: '0.4rem', alignItems: 'baseline' }}>
            {[
              { label: 'Novos',        valor: totalNovos,       count: countNovos,       unit: 'venda(s)' },
              ...(countNovoFollow > 0 ? [{ label: 'Novo Follow', valor: totalNovoFollow, count: countNovoFollow, unit: 'venda(s)' }] : []),
              { label: 'Recorrência', valor: totalRecorrentes,  count: countRecorrentes,  unit: 'venda(s)' },
              { label: 'Indicação',   valor: totalIndicacaoLanc,count: countIndicacaoLanc,unit: 'venda(s)' },
              ...(totalConsultas > 0 ? [{ label: 'Consultas', valor: totalConsultas, count: countConsultas, unit: 'consulta(s)' }] : []),
            ].map(({ label, valor, count, unit }) => (
              <>
                <span key={label+'-l'} className="text-gray-500 text-sm">{label}</span>
                <span key={label+'-v'} className="font-medium text-gray-800 text-sm tabular-nums text-right">{fmt(valor)}</span>
                <span key={label+'-c'} className="text-brand-400 text-xs whitespace-nowrap text-right">{count} {unit}</span>
                <span key={label+'-p'} className="text-gray-400 text-xs whitespace-nowrap text-right">({totalGeral > 0 ? ((valor / totalGeral) * 100).toFixed(1) : 0}%)</span>
              </>
            ))}
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
          <p className="text-3xl font-bold text-gray-900 mb-3">{lMesSemConsulta.length}</p>
          <p className="text-sm text-gray-400">{countNovos} novos · {countRecorrentes} recorrentes</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Conversão na Cadeira</p>
            <span className="text-brand-400 text-lg">💺</span>
          </div>
          <p className={`text-3xl font-bold mb-1 ${cadeiraCompareceu > 0 && cadeiraVendeu / cadeiraCompareceu >= 0.5 ? 'text-green-600' : cadeiraCompareceu > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
            {convCadeira}
          </p>
          <p className="text-xs text-gray-400 mb-3">{cadeiraVendeu} vendas de {cadeiraCompareceu} que vieram</p>
          {planilhaRows.some(r => r.compareceu || r.reagendado) && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {planilhaRows.filter(r => r.compareceu && r.vendeu).map((r, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-green-500 text-xs">✓</span>
                  <span className="text-xs text-gray-700 truncate">{r.nome}{r.reagendado ? ' · out' : ''}</span>
                </div>
              ))}
              {planilhaRows.filter(r => r.compareceu && !r.vendeu && !r.reagendado).map((r, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-red-400 text-xs">✗</span>
                  <span className="text-xs text-gray-400 truncate">{r.nome}</span>
                </div>
              ))}
              {planilhaRows.filter(r => r.reagendado && !r.vendeu).map((r, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-purple-400 text-xs">↻</span>
                  <span className="text-xs text-gray-700 truncate">{r.nome}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TICKET MÉDIO */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Ticket Médio</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Geral', value: fmt(ticketGeral), sub: `${lMesValidos.length} lançamento(s)` },
            { label: 'Novos', value: fmt(ticketNovos), sub: `${countNovos} novos + ${countIndicacaoLanc} indicação` },
            { label: 'Recorrência', value: fmt(ticketRecorrentes), sub: `${countRecorrentes} recorrente(s)` },
            { label: 'Indicação', value: fmt(ticketIndicacao), sub: `${countIndicacaoLanc} indicação(ões)` },
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Seguidores',
              value: seguidores.toLocaleString('pt-BR'),
              icon: '👥',
              color: 'text-brand-500',
              sub: custoPorSeguidor > 0 ? `${fmt(custoPorSeguidor)} por seguidor` : 'total de seguidores',
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
              sub: leadsNovosReais > 0 ? `${leadsNovosReais} leads recebidos` : 'sem leads no mês',
            },
            {
              label: 'CAC',
              value: cacClientes > 0 && trafegoInvestido > 0 ? fmt(trafegoInvestido / cacClientes) : '—',
              icon: '💰',
              color: 'text-orange-500',
              sub: cacClientes > 0 ? `${cacClientes} clientes adquiridos` : 'sem agendamentos',
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
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Social Media', icon: '🔗', color: 'text-brand-500', value: String(seguidores.toLocaleString('pt-BR')), sub: 'seguidores', extras: [`${leadsNovosReais} leads recebidos`, `${convComercial}% conversão`] },
            { label: 'Leads Novos', icon: '🏢', color: 'text-blue-500', value: String(leadsNovosReais + leadsIndicacao.length), sub: 'novos este mês', extras: [`${leadsNovosReais} novos · ${agendadosNovos} agendados`, `${leadsIndicacao.length} indicações · ${agendadosIndicacao} agendadas`, `${totalAgendNovos} agendados (novos + indicação)`, `${convNovos}% conversão`] },
            { label: 'Leads Follow', icon: '🔁', color: 'text-purple-500', value: String(leadsFollowUp.length), sub: `em acompanhamento em ${MESES[mes]}`, extras: [`${fuEmAberto} em aberto · ${fuRespondeu} respondeu`, `${fuAgendado} agendado · ${fuVendido} vendido`, `${convFollow}% conversão`] },
            { label: 'Leads Recorrência', icon: '🔄', color: 'text-teal-500', value: String(leadsRecorrentes.length), sub: 'contatos recorrentes', extras: [`${agendRecorrentes} agendamentos`, `${convRecorrencia}% conversão`] },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                <span className={`text-lg ${card.color}`}>{card.icon}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-400 mb-3">{card.sub}</p>
              <div className="space-y-1">
                {card.extras.map((e, j) => {
                  if (typeof e === 'string' && e.includes('conversão')) {
                    const pct = parseFloat(e)
                    const cor = pct > 15 ? 'text-green-600' : pct >= 10 ? 'text-orange-500' : 'text-red-500'
                    return <p key={j} className={`text-xs font-semibold ${cor}`}>{e}</p>
                  }
                  return <p key={j} className="text-xs text-gray-500">{e}</p>
                })}
              </div>
            </div>
          ))}

          {/* Card Conversão */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm text-gray-500 font-medium">Conversão</p>
              <span className="text-lg text-green-500">📈</span>
            </div>
            {(() => {
              const pctTotal = parseFloat(convComercial)
              const corTotal = pctTotal > 15 ? 'text-green-600' : pctTotal >= 10 ? 'text-orange-500' : 'text-red-500'
              return (
                <>
                  <p className={`text-2xl font-bold mb-0.5 ${corTotal}`}>{convComercial}%</p>
                  <p className="text-xs text-gray-400 mb-3">taxa geral</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Leads Novos', pct: convNovos },
                      { label: 'Leads Follow', pct: convFollow },
                    ].map(({ label, pct: p }) => {
                      const v = parseFloat(p)
                      const cor = v > 15 ? 'text-green-600' : v >= 10 ? 'text-orange-500' : 'text-red-500'
                      return (
                        <p key={label} className="text-xs text-gray-500">
                          {label}: <span className={`font-semibold ${cor}`}>{p}%</span>
                        </p>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
