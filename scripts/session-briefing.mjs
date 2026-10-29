#!/usr/bin/env node
// Briefing automático da Clínica Dra. Amanda Lima
// Roda no SessionStart do Claude Code e imprime o estado do sistema

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Carrega .env.local
function loadEnv() {
  try {
    const lines = readFileSync(new URL('../.env.local', import.meta.url).pathname, 'utf8').split('\n')
    for (const line of lines) {
      const [k, ...v] = line.split('=')
      if (k && v.length) process.env[k.trim()] = v.join('=').trim()
    }
  } catch {}
}
loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cojduxlqjwskfqqfximo.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_KEY) process.exit(0)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function fmt(v) {
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

async function getClinicaId() {
  const { data } = await supabase.from('clinica_master').select('admin_id').limit(1).maybeSingle()
  return data?.admin_id || null
}

async function main() {
  const clinicaId = await getClinicaId()
  if (!clinicaId) return

  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)
  const ontemStr = ontem.toISOString().split('T')[0]

  const ano = hoje.getFullYear()
  const mes = hoje.getMonth() + 1
  const prefix = `${ano}-${String(mes).padStart(2, '0')}`
  const ini = `${prefix}-01`
  const proxMes = mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, '0')}`
  const fim = `${proxMes}-01`

  const [
    { data: agendHoje },
    { data: lancOntem },
    { data: lancMes },
    { data: planilhaLeads, count: totalLeads },
    { data: lembHoje },
    { data: recorrentes, count: totalRec },
    { data: followHoje },
  ] = await Promise.all([
    supabase.from('agendamentos').select('paciente, procedimento, time').eq('clinica_id', clinicaId).eq('date', hojeStr).order('time'),
    supabase.from('lancamentos').select('valor_tratamento, valor_taxa').eq('clinica_id', clinicaId).eq('data', ontemStr).neq('tipo', 'Paciente Modelo'),
    supabase.from('lancamentos').select('valor_tratamento, valor_taxa').eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim).neq('tipo', 'Paciente Modelo'),
    supabase.from('planilha_leads').select('agendou, vendeu', { count: 'exact' }).eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim),
    supabase.from('lembretes').select('lead_nome, descricao').eq('clinica_id', clinicaId).eq('data', hojeStr).eq('concluido', false),
    supabase.from('planilha_recorrentes').select('agendou', { count: 'exact' }).eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim),
    supabase.from('planilha_leads').select('nome, telefone').eq('clinica_id', clinicaId).or(`follow_up_1.eq.${hojeStr},follow_up_2.eq.${hojeStr},follow_up_3.eq.${hojeStr}`),
  ])

  const fatOntem = (lancOntem || []).reduce((a, l) => a + (l.valor_tratamento || 0) + (l.valor_taxa || 0), 0)
  const fatMes = (lancMes || []).reduce((a, l) => a + (l.valor_tratamento || 0) + (l.valor_taxa || 0), 0)
  const agendadosMes = (planilhaLeads || []).filter(r => r.agendou).length
  const vendidosMes = (planilhaLeads || []).filter(r => r.vendeu).length
  const recAgendados = (recorrentes || []).filter(r => r.agendou && r.agendou !== 'NÃO' && r.agendou !== false).length

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const nomeMes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const diaSemana = diasSemana[hoje.getDay()]
  const dataFmt = `${diaSemana}, ${hoje.getDate()} de ${nomeMes[hoje.getMonth()]} de ${ano}`

  const linhas = []
  linhas.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  linhas.push(`  BRIEFING — Clínica Dra. Amanda Lima`)
  linhas.push(`  ${dataFmt}`)
  linhas.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  // Agendamentos de hoje
  if (agendHoje?.length > 0) {
    linhas.push(`\n📅 HOJE — ${agendHoje.length} agendamento(s)`)
    for (const a of agendHoje) linhas.push(`   ${a.time || '--:--'} · ${a.paciente} · ${a.procedimento || ''}`)
  } else {
    linhas.push(`\n📅 HOJE — Nenhum agendamento`)
  }

  // Follow-ups para fazer hoje
  if (followHoje?.length > 0) {
    linhas.push(`\n📞 FOLLOW-UPS HOJE — ${followHoje.length} lead(s)`)
    for (const l of followHoje) linhas.push(`   ${l.nome}${l.telefone ? ' · ' + l.telefone : ''}`)
  }

  // Lembretes
  if (lembHoje?.length > 0) {
    linhas.push(`\n🔔 LEMBRETES — ${lembHoje.length}`)
    for (const l of lembHoje) linhas.push(`   ${l.lead_nome} · ${l.descricao}`)
  }

  // Faturamento
  linhas.push(`\n💰 FATURAMENTO`)
  linhas.push(`   Ontem:   ${fmt(fatOntem)}`)
  linhas.push(`   ${nomeMes[mes - 1]}/total: ${fmt(fatMes)}`)

  // Leads do mês
  linhas.push(`\n📊 LEADS ${nomeMes[mes - 1]}`)
  linhas.push(`   Novos: ${totalLeads || 0} leads · ${agendadosMes} agendados · ${vendidosMes} vendidos`)
  linhas.push(`   Recorrentes: ${totalRec || 0} contatos · ${recAgendados} agendados`)

  // Alertas
  const alertas = []
  if (!totalLeads || totalLeads === 0) alertas.push('⚠️  Nenhum lead novos encontrado — sync necessário')
  if (fatMes === 0) alertas.push('⚠️  Nenhum lançamento no mês — verificar Faturamento')
  if (alertas.length > 0) {
    linhas.push(`\n🚨 ALERTAS`)
    alertas.forEach(a => linhas.push(`   ${a}`))
  } else {
    linhas.push(`\n✅ Sistema sem alertas`)
  }

  linhas.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  console.log(linhas.join('\n'))
}

main().catch(() => {})
