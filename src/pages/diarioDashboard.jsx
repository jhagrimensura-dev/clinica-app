import { useEffect, useState } from 'react'
import { useVendas } from '../context/VendasContext'
import { useFinanceiro } from '../context/FinanceiroContext'
import { useClinica } from '../context/ClinicaContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const DIAS_SEMANA = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']
const MESES_NOME = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

export default function DiarioDashboard() {
  const { lancamentos } = useVendas()
  const { mes, ano } = useFinanceiro()
  const { metaValor, diasAtendimento, metaDiaria } = useClinica()
  const { clinicaId } = useAuth()

  const hoje = new Date().toISOString().slice(0, 10)
  const [dia, setDia] = useState(hoje)

  const [planilhaRows, setPlanilhaRows] = useState([])
  const [followupRows, setFollowupRows] = useState([])
  const [recorrentesRows, setRecorrentesRows] = useState([])

  useEffect(() => {
    if (!clinicaId) return
    const monthStart = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
    const nextMonth = mes === 11
      ? `${ano + 1}-01-01`
      : `${ano}-${String(mes + 2).padStart(2, '0')}-01`

    supabase.from('planilha_leads')
      .select('data, nome, origem, agendou, compareceu, vendeu, valor_procedimento, reagendado')
      .eq('clinica_id', clinicaId)
      .gte('data', monthStart)
      .lt('data', nextMonth)
      .then(({ data }) => setPlanilhaRows(data || []))

    supabase.from('planilha_followup')
      .select('data_followup, nome, agendou, vendeu')
      .eq('clinica_id', clinicaId)
      .gte('data_followup', monthStart)
      .lt('data_followup', nextMonth)
      .then(({ data }) => setFollowupRows(data || []))

    supabase.from('planilha_recorrentes')
      .select('data, nome, agendou, vendeu')
      .eq('clinica_id', clinicaId)
      .gte('data', monthStart)
      .lt('data', nextMonth)
      .then(({ data }) => setRecorrentesRows(data || []))
  }, [clinicaId, mes, ano])

  useEffect(() => {
    const mesStr = `${ano}-${String(mes + 1).padStart(2, '0')}`
    if (!dia.startsWith(mesStr)) setDia(`${mesStr}-01`)
  }, [mes, ano])

  const isConsulta = (l) => (l.procedimentos || '').toLowerCase().trim() === 'consulta'

  const lDia = lancamentos.filter(l => l.data === dia && l.tipo !== 'Paciente Modelo')
  const lDiaSemConsulta = lDia.filter(l => !isConsulta(l))

  const totalGeral = lDia.reduce((acc, l) => acc + (l.valorTratamento || 0) + (l.valorTaxa || 0), 0)
  const totalNovos       = lDiaSemConsulta.filter(l => l.tipo === 'Novo').reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const totalNovoFollow  = lDiaSemConsulta.filter(l => l.tipo === 'Novo Follow').reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const totalRecorrentes = lDiaSemConsulta.filter(l => l.tipo === 'Recorrência').reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const totalIndicacao   = lDiaSemConsulta.filter(l => l.tipo === 'Indicação').reduce((acc, l) => acc + (l.valorTratamento || 0), 0)
  const countNovos       = lDiaSemConsulta.filter(l => l.tipo === 'Novo').length
  const countNovoFollow  = lDiaSemConsulta.filter(l => l.tipo === 'Novo Follow').length
  const countRecorrentes = lDiaSemConsulta.filter(l => l.tipo === 'Recorrência').length
  const countIndicacao   = lDiaSemConsulta.filter(l => l.tipo === 'Indicação').length
  const lConsultas       = lDia.filter(l => isConsulta(l))
  const totalConsultas   = lConsultas.reduce((acc, l) => acc + (l.valorTaxa || 0), 0)
  const countConsultas   = lConsultas.length

  const ticketGeral       = lDia.length > 0 ? totalGeral / lDia.length : 0
  const ticketNovos       = (countNovos + countIndicacao) > 0 ? (totalNovos + totalIndicacao) / (countNovos + countIndicacao) : 0
  const ticketRecorrentes = countRecorrentes > 0 ? totalRecorrentes / countRecorrentes : 0
  const ticketIndicacao   = countIndicacao > 0 ? totalIndicacao / countIndicacao : 0

  // Filtro por dia
  const rowsDia        = planilhaRows.filter(r => r.data === dia)
  const followDia      = followupRows.filter(r => r.data_followup === dia)
  const recorrentesDia = recorrentesRows.filter(r => r.data === dia)

  // Leads Novos
  const leadsNovos      = rowsDia.filter(r => r.origem !== 'Indicação').length
  const leadsIndicacao  = rowsDia.filter(r => r.origem === 'Indicação').length
  const totalLeadsDia   = leadsNovos + leadsIndicacao
  const agendadosNovos  = rowsDia.filter(r => r.agendou && r.origem !== 'Indicação').length
  const agendadosIndic  = rowsDia.filter(r => r.agendou && r.origem === 'Indicação').length
  const totalAgendNovos = rowsDia.filter(r => r.agendou).length

  // Leads Follow
  const fuAgendado = followDia.filter(r => r.agendou).length
  const fuVendido  = followDia.filter(r => r.vendeu).length

  // Leads Recorrência
  const recAgendados = recorrentesDia.filter(r => r.agendou).length

  // Conversão na cadeira
  const veioNaCadeira  = r => (r.compareceu || r.vendeu) && (!r.reagendado || r.vendeu)
  const fuCadeira      = followDia.filter(r => r.vendeu)
  const cadeiraComp    = rowsDia.filter(veioNaCadeira).length + fuCadeira.length
  const cadeiraVendeu  = rowsDia.filter(r => r.vendeu).length + fuCadeira.length
  const convCadeira    = cadeiraComp > 0 ? `${((cadeiraVendeu / cadeiraComp) * 100).toFixed(0)}%` : '—'

  // Conversões Visão Comercial
  const convNovos    = totalLeadsDia > 0 ? ((totalAgendNovos / totalLeadsDia) * 100).toFixed(1) : '0.0'
  const convFollow   = followDia.length > 0 ? (((fuAgendado + fuVendido) / followDia.length) * 100).toFixed(1) : '0.0'
  const convComercial = (parseFloat(convNovos) + parseFloat(convFollow)).toFixed(1)

  // Meta diária
  const pctMeta = metaDiaria > 0 ? Math.min((totalGeral / metaDiaria) * 100, 100).toFixed(1) : '0.0'

  // Navegação
  const [, diaMes, diaDia] = dia.split('-')
  const dataObj    = new Date(dia + 'T12:00:00')
  const diaFormat  = `${DIAS_SEMANA[dataObj.getDay()]}, ${parseInt(diaDia)} de ${MESES_NOME[parseInt(diaMes) - 1]}`
  const mesStr     = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const daysInMonth = new Date(ano, mes + 1, 0).getDate()
  const diaMin     = `${mesStr}-01`
  const diaMax     = `${mesStr}-${String(daysInMonth).padStart(2, '0')}`

  const temDados = totalGeral > 0 || rowsDia.length > 0 || followDia.length > 0 || recorrentesDia.length > 0

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* Navegador de dia */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{diaFormat}</p>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
          <button
            onClick={() => { const prev = addDays(dia, -1); if (prev >= diaMin) setDia(prev) }}
            disabled={dia <= diaMin}
            className="text-gray-400 hover:text-gray-700 font-bold disabled:opacity-30"
          >‹</button>
          <p className="text-sm font-bold text-gray-800 min-w-[32px] text-center">{parseInt(diaDia)}</p>
          <button
            onClick={() => { const next = addDays(dia, 1); if (next <= diaMax) setDia(next) }}
            disabled={dia >= diaMax}
            className="text-gray-400 hover:text-gray-700 font-bold disabled:opacity-30"
          >›</button>
        </div>
      </div>

      {/* LINHA 1 — 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Faturamento */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Faturamento do Dia</p>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{fmt(totalGeral)}</p>
          <p className="text-xs text-gray-400 mb-2">Meta: {metaDiaria > 0 ? fmt(metaDiaria) : '—'}</p>
          {metaDiaria > 0 && (
            <>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div className="bg-brand-400 h-2 rounded-full transition-all" style={{ width: `${pctMeta}%` }} />
              </div>
              <p className="text-xs text-brand-500 font-medium mb-3">{pctMeta}% da meta</p>
            </>
          )}
          {totalGeral > 0 && (
            <div className="pt-2 border-t border-gray-100" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', columnGap: '0.5rem', rowGap: '0.4rem', alignItems: 'baseline' }}>
              {[
                { label: 'Novos',       valor: totalNovos,       count: countNovos,       unit: 'venda(s)' },
                ...(countNovoFollow > 0 ? [{ label: 'Novo Follow', valor: totalNovoFollow, count: countNovoFollow, unit: 'venda(s)' }] : []),
                { label: 'Recorrência', valor: totalRecorrentes, count: countRecorrentes, unit: 'venda(s)' },
                { label: 'Indicação',   valor: totalIndicacao,   count: countIndicacao,   unit: 'venda(s)' },
                ...(totalConsultas > 0 ? [{ label: 'Consultas', valor: totalConsultas, count: countConsultas, unit: 'consulta(s)' }] : []),
              ].filter(r => r.count > 0).map(({ label, valor, count, unit }) => (
                <>
                  <span key={label+'-l'} className="text-gray-500 text-sm">{label}</span>
                  <span key={label+'-v'} className="font-medium text-gray-800 text-sm tabular-nums text-right">{fmt(valor)}</span>
                  <span key={label+'-c'} className="text-brand-400 text-xs whitespace-nowrap text-right">{count} {unit}</span>
                  <span key={label+'-p'} className="text-gray-400 text-xs whitespace-nowrap text-right">({totalGeral > 0 ? ((valor / totalGeral) * 100).toFixed(1) : 0}%)</span>
                </>
              ))}
            </div>
          )}
        </div>

        {/* Meta do Dia */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Meta do Dia</p>
            <span className="text-lg">🎯</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">{metaDiaria > 0 ? fmt(metaDiaria) : '—'}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-500">Realizado: <span className={`font-semibold ${totalGeral >= metaDiaria && metaDiaria > 0 ? 'text-green-600' : 'text-gray-700'}`}>{fmt(totalGeral)}</span></p>
            {metaDiaria > 0 && totalGeral < metaDiaria && (
              <p className="text-xs text-orange-500">Faltam {fmt(metaDiaria - totalGeral)}</p>
            )}
            {metaDiaria > 0 && totalGeral >= metaDiaria && (
              <p className="text-xs text-green-600 font-medium">Meta atingida ✓</p>
            )}
          </div>
        </div>

        {/* Vendas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Vendas</p>
            <span className="text-lg">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-3">{lDiaSemConsulta.length}</p>
          <p className="text-sm text-gray-400">{countNovos} novos · {countRecorrentes} recorrentes</p>
        </div>

        {/* Conversão na Cadeira */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-gray-500 font-medium">Conversão na Cadeira</p>
            <span className="text-lg">💺</span>
          </div>
          <p className={`text-3xl font-bold mb-1 ${cadeiraComp > 0 && cadeiraVendeu / cadeiraComp >= 0.5 ? 'text-green-600' : cadeiraComp > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
            {convCadeira}
          </p>
          <p className="text-xs text-gray-400 mb-3">{cadeiraVendeu} vendas de {cadeiraComp} que vieram</p>
          {(rowsDia.some(r => r.compareceu || r.reagendado) || fuCadeira.length > 0) && (
            <div className="pt-2 border-t border-gray-100 space-y-1.5 overflow-y-auto" style={{ maxHeight: '9rem' }}>
              {rowsDia.filter(r => r.vendeu).map((r, i) => (
                <div key={`n-${i}`} className="flex items-center gap-1.5">
                  <span className="text-green-500 text-xs">✓</span>
                  <span className="text-xs text-gray-700 truncate">{r.nome}{r.reagendado ? ' · próx. mês' : ''}</span>
                </div>
              ))}
              {fuCadeira.map((r, i) => (
                <div key={`fu-${i}`} className="flex items-center gap-1.5">
                  <span className="text-green-500 text-xs">✓</span>
                  <span className="text-xs text-gray-700 truncate">{r.nome} · follow</span>
                </div>
              ))}
              {rowsDia.filter(r => (r.compareceu || r.vendeu) && !r.vendeu && !r.reagendado).map((r, i) => (
                <div key={`x-${i}`} className="flex items-center gap-1.5">
                  <span className="text-red-400 text-xs">✗</span>
                  <span className="text-xs text-gray-400 truncate">{r.nome}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TICKET MÉDIO */}
      {totalGeral > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Ticket Médio</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Geral',       value: fmt(ticketGeral),       sub: `${lDia.length} lançamento(s)` },
              { label: 'Novos',       value: fmt(ticketNovos),       sub: `${countNovos} novos + ${countIndicacao} indicação` },
              { label: 'Recorrência', value: fmt(ticketRecorrentes), sub: `${countRecorrentes} recorrente(s)` },
              { label: 'Indicação',   value: fmt(ticketIndicacao),   sub: `${countIndicacao} indicação(ões)` },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-2">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISÃO COMERCIAL */}
      {temDados && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Visão Comercial</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Leads Novos */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-gray-500 font-medium">Leads Novos</p>
                <span className="text-blue-500 text-lg">🏢</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{totalLeadsDia}</p>
              <p className="text-xs text-gray-400 mb-3">novos hoje</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>{leadsNovos} novos · {agendadosNovos} agendados</p>
                <p>{leadsIndicacao} indicações · {agendadosIndic} agendadas</p>
                <p>{totalAgendNovos} agendados (novos + indicação)</p>
                {totalLeadsDia > 0 && <p className="font-semibold text-brand-500">{convNovos}% conversão</p>}
              </div>
            </div>

            {/* Leads Follow */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-gray-500 font-medium">Leads Follow</p>
                <span className="text-purple-500 text-lg">🔁</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{followDia.length}</p>
              <p className="text-xs text-gray-400 mb-3">follow-ups hoje</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>{followDia.filter(r => !r.agendou && !r.vendeu).length} em aberto · {fuAgendado} agendado · {fuVendido} vendido</p>
                {followDia.length > 0 && <p className="font-semibold text-brand-500">{convFollow}% conversão</p>}
              </div>
            </div>

            {/* Leads Recorrência */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-gray-500 font-medium">Leads Recorrência</p>
                <span className="text-teal-500 text-lg">🔄</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{recorrentesDia.length}</p>
              <p className="text-xs text-gray-400 mb-3">contatos recorrentes</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>{recAgendados} agendamentos</p>
                {recorrentesDia.length > 0 && recorrentesDia.filter(r => r.vendeu).length > 0 && (
                  <p className="font-semibold text-brand-500">{recorrentesDia.filter(r => r.vendeu).length} vendidos</p>
                )}
              </div>
            </div>

            {/* Conversão Novos + Follow + Indicação */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-gray-500 font-medium">Conversão Novos + Follow + Indicação</p>
                <span className="text-orange-500 text-lg">📈</span>
              </div>
              <p className={`text-3xl font-bold mb-1 ${parseFloat(convComercial) >= 10 ? 'text-green-600' : parseFloat(convComercial) > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                {(totalLeadsDia + followDia.length) > 0 ? `${convComercial}%` : '—'}
              </p>
              <p className="text-xs text-gray-400 mb-3">taxa geral</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>Leads Novos: {totalAgendNovos} agend. · {convNovos}%</p>
                <p>Leads Follow: {fuAgendado + fuVendido} agend. · {convFollow}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEADS DO DIA — tabela */}
      {(rowsDia.length > 0 || followDia.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Leads do Dia</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    {['Nome', 'Origem', 'Agendou', 'Compareceu', 'Vendeu'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsDia.map((r, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.nome}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{r.origem || '—'}</td>
                      <td className="px-4 py-2.5">{r.agendou ? <span className="text-green-500 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2.5">{r.compareceu || r.vendeu ? <span className="text-green-500 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2.5">{r.vendeu ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                  {followDia.map((r, i) => (
                    <tr key={`fu-${i}`} className="border-t border-gray-50 hover:bg-gray-50 bg-purple-50/30">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.nome}</td>
                      <td className="px-4 py-2.5 text-purple-400 text-xs">Follow-up</td>
                      <td className="px-4 py-2.5">{r.agendou ? <span className="text-green-500 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2.5"><span className="text-gray-300">—</span></td>
                      <td className="px-4 py-2.5">{r.vendeu ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!temDados && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium text-gray-500">Sem registros para esse dia</p>
          <p className="text-xs mt-1">Use as setas para navegar entre os dias do mês</p>
        </div>
      )}
    </div>
  )
}
