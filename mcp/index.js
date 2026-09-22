import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cojduxlqjwskfqqfximo.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_KEY ou SUPABASE_ANON_KEY é obrigatório')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Detecta clinica_id (admin_id UUID) automaticamente ───────────────────────
let CLINICA_ID = process.env.CLINICA_ID || null

async function getClinicaId() {
  if (CLINICA_ID) return CLINICA_ID
  // clinica_id nas tabelas = admin_id da clinica_master
  const { data } = await supabase.from('clinica_master').select('admin_id').limit(1).maybeSingle()
  CLINICA_ID = data?.admin_id || null
  return CLINICA_ID
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mesAtual() {
  const hoje = new Date()
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 }
}

function prefixMes(ano, mes) {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

function ok(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] }
}

function err(msg) {
  return { content: [{ type: 'text', text: `Erro: ${msg}` }], isError: true }
}

// ── Servidor MCP ──────────────────────────────────────────────────────────────
const server = new McpServer({
  name: 'clinica-dra-amanda',
  version: '1.0.0',
})

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 1 — Resumo do mês
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'resumo_mes',
  'Resumo completo do mês: leads, faturamento, agendamentos, taxa de conversão.',
  {
    ano: z.number().optional().describe('Ano (padrão: atual)'),
    mes: z.number().min(1).max(12).optional().describe('Mês 1-12 (padrão: atual)'),
  },
  async ({ ano, mes }) => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const { ano: anoAtual, mes: mesAtualNum } = mesAtual()
    const a = ano ?? anoAtual
    const m = mes ?? mesAtualNum
    const prefix = prefixMes(a, m)

    const [
      { data: lancamentos },
      { data: agendamentos },
      { data: planilha },
    ] = await Promise.all([
      supabase.from('lancamentos').select('tipo, valor_tratamento, valor_taxa, data, procedimentos').eq('clinica_id', clinicaId).like('data', `${prefix}%`),
      supabase.from('agendamentos').select('id, status, date').eq('clinica_id', clinicaId).like('date', `${prefix}%`),
      supabase.from('planilha_leads').select('agendou, compareceu, vendeu, valor_procedimento').eq('clinica_id', clinicaId).like('data', `${prefix}%`),
    ])

    // Faturamento
    const consultas = (lancamentos || []).filter(l => l.tipo === 'consulta')
    const procedimentos = (lancamentos || []).filter(l => l.tipo !== 'consulta')
    const totalProc = procedimentos.reduce((a, l) => a + (l.valor_tratamento || 0), 0)
    const totalCons = consultas.reduce((a, l) => a + (l.valor_taxa || 0), 0)
    const ticketMedio = procedimentos.length > 0 ? totalProc / procedimentos.length : 0

    // Planilha
    const pl = planilha || []
    const agendados = pl.filter(r => r.agendou).length
    const compareceram = pl.filter(r => r.compareceu).length
    const vendidos = pl.filter(r => r.vendeu).length
    const taxaAgend = pl.length > 0 ? Math.round((agendados / pl.length) * 100) : 0
    const taxaVenda = agendados > 0 ? Math.round((vendidos / agendados) * 100) : 0

    return ok({
      periodo: `${String(m).padStart(2, '0')}/${a}`,
      faturamento: {
        total: totalProc + totalCons,
        procedimentos_valor: totalProc,
        consultas_valor: totalCons,
        qtd_procedimentos: procedimentos.length,
        qtd_consultas: consultas.length,
        ticket_medio: Math.round(ticketMedio),
      },
      leads: {
        total_mes: pl.length,
        agendados,
        compareceram,
        vendidos,
        taxa_agendamento: `${taxaAgend}%`,
        taxa_conversao: `${taxaVenda}%`,
      },
      agendamentos: {
        total: (agendamentos || []).length,
      },
    })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 2 — Pipeline de leads
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'leads_pipeline',
  'Status atual de todos os leads: quantos em cada etapa do funil.',
  {},
  async () => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const { data: leads } = await supabase
      .from('leads')
      .select('id, nome, status, origem, fonte, data, telefone')
      .eq('clinica_id', clinicaId)
      .order('data', { ascending: false })
      .limit(200)

    const porStatus = {}
    for (const l of leads || []) {
      const s = l.status || 'sem_status'
      if (!porStatus[s]) porStatus[s] = []
      porStatus[s].push({ nome: l.nome, origem: l.origem || l.fonte, data: l.data })
    }

    const contagem = Object.entries(porStatus).map(([status, itens]) => ({
      status,
      total: itens.length,
      exemplos: itens.slice(0, 3).map(i => i.nome),
    })).sort((a, b) => b.total - a.total)

    return ok({ total_leads: (leads || []).length, por_status: contagem })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 3 — Leads sem follow-up (precisam de atenção)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'leads_sem_followup',
  'Leads que estão parados sem follow-up há mais de N dias.',
  {
    dias: z.number().optional().default(7).describe('Dias sem contato (padrão: 7)'),
    limit: z.number().optional().default(20).describe('Máximo de leads a retornar'),
  },
  async ({ dias, limit }) => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const corte = new Date()
    corte.setDate(corte.getDate() - dias)
    const corteStr = corte.toISOString().split('T')[0]

    const { data: leads } = await supabase
      .from('planilha_leads')
      .select('nome, telefone, data, follow_up_1, follow_up_2, follow_up_3, follow_ups_feitos, observacao')
      .eq('clinica_id', clinicaId)
      .lte('data', corteStr)
      .is('vendeu', false)
      .order('data', { ascending: true })
      .limit(limit)

    const semContato = (leads || []).filter(l => {
      const feitos = l.follow_ups_feitos ? l.follow_ups_feitos.split(',').filter(Boolean).length : 0
      return feitos === 0
    })

    const comFollowupAtrasado = (leads || []).filter(l => {
      const prox = [l.follow_up_1, l.follow_up_2, l.follow_up_3].find(d => d)
      if (!prox) return false
      return prox < corteStr
    })

    return ok({
      sem_nenhum_contato: {
        total: semContato.length,
        leads: semContato.slice(0, 10).map(l => ({ nome: l.nome, telefone: l.telefone, data_entrada: l.data })),
      },
      followup_atrasado: {
        total: comFollowupAtrasado.length,
        leads: comFollowupAtrasado.slice(0, 10).map(l => ({ nome: l.nome, telefone: l.telefone, proximo_followup: l.follow_up_1 })),
      },
    })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 4 — Faturamento detalhado
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'faturamento_detalhado',
  'Lançamentos financeiros do mês com detalhes por procedimento/consulta.',
  {
    ano: z.number().optional(),
    mes: z.number().min(1).max(12).optional(),
  },
  async ({ ano, mes }) => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const { ano: anoAtual, mes: mesAtualNum } = mesAtual()
    const a = ano ?? anoAtual
    const m = mes ?? mesAtualNum
    const prefix = prefixMes(a, m)

    const { data: lancamentos } = await supabase
      .from('lancamentos')
      .select('tipo, procedimentos, valor_tratamento, valor_taxa, data, paciente, responsavel')
      .eq('clinica_id', clinicaId)
      .like('data', `${prefix}%`)
      .order('data', { ascending: false })

    const items = lancamentos || []
    const consultas = items.filter(l => l.tipo === 'consulta')
    const procedimentos = items.filter(l => l.tipo !== 'consulta')

    const totalProc = procedimentos.reduce((a, l) => a + (l.valor_tratamento || 0), 0)
    const totalCons = consultas.reduce((a, l) => a + (l.valor_taxa || 0), 0)

    // Agrupa por procedimento
    const porTipo = {}
    for (const l of procedimentos) {
      const procs = Array.isArray(l.procedimentos) ? l.procedimentos : [l.tipo || 'Outro']
      for (const p of procs) {
        if (!porTipo[p]) porTipo[p] = { count: 0, total: 0 }
        porTipo[p].count++
        porTipo[p].total += (l.valor_tratamento || 0) / procs.length
      }
    }

    return ok({
      periodo: `${String(m).padStart(2, '0')}/${a}`,
      total_geral: totalProc + totalCons,
      procedimentos: {
        total: totalProc,
        quantidade: procedimentos.length,
        ticket_medio: procedimentos.length > 0 ? Math.round(totalProc / procedimentos.length) : 0,
        por_tipo: Object.entries(porTipo)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([nome, v]) => ({ procedimento: nome, quantidade: v.count, total: v.total })),
      },
      consultas: {
        total: totalCons,
        quantidade: consultas.length,
      },
    })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 5 — Agenda dos próximos dias
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'agenda_proximos_dias',
  'Agendamentos e lembretes dos próximos dias.',
  {
    dias: z.number().optional().default(7).describe('Quantos dias à frente (padrão: 7)'),
  },
  async ({ dias }) => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const hoje = new Date().toISOString().split('T')[0]
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + dias)
    const futuroStr = futuro.toISOString().split('T')[0]

    const [{ data: agendamentos }, { data: lembretes }] = await Promise.all([
      supabase.from('agendamentos')
        .select('date, time, paciente, procedimento, status')
        .eq('clinica_id', clinicaId)
        .gte('date', hoje)
        .lte('date', futuroStr)
        .order('date').order('time'),
      supabase.from('lembretes')
        .select('data, descricao, lead_nome, concluido')
        .eq('clinica_id', clinicaId)
        .gte('data', hoje)
        .lte('data', futuroStr)
        .eq('concluido', false)
        .order('data'),
    ])

    return ok({
      periodo: `${hoje} → ${futuroStr}`,
      agendamentos: (agendamentos || []).map(a => ({
        data: a.date,
        hora: a.time,
        paciente: a.paciente,
        procedimento: a.procedimento,
        status: a.status,
      })),
      lembretes_pendentes: (lembretes || []).map(l => ({
        data: l.data,
        lead: l.lead_nome,
        descricao: l.descricao,
      })),
    })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 6 — Leads por origem
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'leads_por_origem',
  'Quantos leads vieram de cada canal (Instagram, indicação, etc.) no mês.',
  {
    ano: z.number().optional(),
    mes: z.number().min(1).max(12).optional(),
  },
  async ({ ano, mes }) => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const { ano: anoAtual, mes: mesAtualNum } = mesAtual()
    const a = ano ?? anoAtual
    const m = mes ?? mesAtualNum
    const prefix = prefixMes(a, m)

    const { data: planilha } = await supabase
      .from('planilha_leads')
      .select('origem, criativo, agendou, vendeu, valor_procedimento')
      .eq('clinica_id', clinicaId)
      .like('data', `${prefix}%`)

    const porOrigem = {}
    for (const l of planilha || []) {
      const k = l.origem || 'Não informado'
      if (!porOrigem[k]) porOrigem[k] = { leads: 0, agendamentos: 0, vendas: 0, receita: 0 }
      porOrigem[k].leads++
      if (l.agendou) porOrigem[k].agendamentos++
      if (l.vendeu) { porOrigem[k].vendas++; porOrigem[k].receita += l.valor_procedimento || 0 }
    }

    const ranking = Object.entries(porOrigem)
      .map(([origem, v]) => ({
        origem,
        leads: v.leads,
        agendamentos: v.agendamentos,
        vendas: v.vendas,
        receita: v.receita,
        taxa_conversao: v.leads > 0 ? `${Math.round((v.vendas / v.leads) * 100)}%` : '0%',
      }))
      .sort((a, b) => b.leads - a.leads)

    return ok({ periodo: `${String(m).padStart(2, '0')}/${a}`, por_origem: ranking })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 7 — Buscar lead
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'buscar_lead',
  'Busca um lead pelo nome ou telefone e retorna seu histórico completo.',
  {
    busca: z.string().describe('Nome ou telefone do lead'),
  },
  async ({ busca }) => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const { data: leads } = await supabase
      .from('planilha_leads')
      .select('*')
      .eq('clinica_id', clinicaId)
      .or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`)
      .limit(5)

    if (!leads?.length) return ok({ resultado: 'Nenhum lead encontrado', busca })

    return ok({
      total_encontrados: leads.length,
      leads: leads.map(l => ({
        nome: l.nome,
        telefone: l.telefone,
        data: l.data,
        origem: l.origem,
        criativo: l.criativo,
        agendou: l.agendou,
        compareceu: l.compareceu,
        vendeu: l.vendeu,
        valor: l.valor_procedimento,
        observacao: l.observacao,
        followups_feitos: l.follow_ups_feitos,
      })),
    })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 8 — Análises de conversas salvas
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'analises_conversas',
  'Lista as análises de conversas salvas pelo analisador de IA, com objeções e temperaturas.',
  {
    limit: z.number().optional().default(10),
    temperatura: z.enum(['frio', 'morno', 'quente']).optional().describe('Filtrar por temperatura'),
  },
  async ({ limit, temperatura }) => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    let query = supabase
      .from('analises_conversas')
      .select('nome_lead, resultado, criado_em')
      .eq('clinica_id', clinicaId)
      .order('criado_em', { ascending: false })
      .limit(limit)

    const { data } = await query

    let analises = data || []
    if (temperatura) {
      analises = analises.filter(a => a.resultado?.temperatura === temperatura)
    }

    return ok({
      total: analises.length,
      analises: analises.map(a => ({
        lead: a.nome_lead,
        data: a.criado_em?.split('T')[0],
        temperatura: a.resultado?.temperatura,
        resumo: a.resultado?.resumo,
        objecoes: (a.resultado?.objecoes || []).map(o => o.objecao),
        proximos_passos: a.resultado?.proximos_passos,
      })),
    })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 9 — Métricas de performance geral
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'performance_geral',
  'Compara os últimos 3 meses: faturamento, leads e conversão lado a lado.',
  {},
  async () => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const meses = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      meses.push({ ano: d.getFullYear(), mes: d.getMonth() + 1 })
    }

    const resultados = await Promise.all(meses.map(async ({ ano, mes }) => {
      const prefix = prefixMes(ano, mes)
      const [{ data: lanc }, { data: pl }] = await Promise.all([
        supabase.from('lancamentos').select('tipo, valor_tratamento, valor_taxa').eq('clinica_id', clinicaId).like('data', `${prefix}%`),
        supabase.from('planilha_leads').select('agendou, vendeu, valor_procedimento').eq('clinica_id', clinicaId).like('data', `${prefix}%`),
      ])

      const procs = (lanc || []).filter(l => l.tipo !== 'consulta')
      const totalProc = procs.reduce((a, l) => a + (l.valor_tratamento || 0), 0)
      const totalCons = (lanc || []).filter(l => l.tipo === 'consulta').reduce((a, l) => a + (l.valor_taxa || 0), 0)
      const leads = (pl || []).length
      const vendas = (pl || []).filter(r => r.vendeu).length
      const agendados = (pl || []).filter(r => r.agendou).length

      return {
        periodo: `${String(mes).padStart(2, '0')}/${ano}`,
        faturamento: totalProc + totalCons,
        procedimentos: procs.length,
        ticket_medio: procs.length > 0 ? Math.round(totalProc / procs.length) : 0,
        leads_novos: leads,
        agendamentos: agendados,
        vendas,
        taxa_conversao: leads > 0 ? `${Math.round((vendas / leads) * 100)}%` : '0%',
      }
    }))

    return ok({ comparativo_3_meses: resultados })
  }
)

// ── Inicia o servidor ─────────────────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)
