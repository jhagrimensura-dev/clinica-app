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

// ── Google Sheets config ──────────────────────────────────────────────────────
const SHEETS_PUBLISHED_ID = '2PACX-1vSQHBxm7a-u_r5dMNrZtYoMHRs3awELyB968s8aqj0HcJSeP1PjnE3n_FWZ8bB54BeFNVc3Syv0E5Fr'
const SHEETS_GIDS = { novos: '574898400', followup: '1573659618', recorrentes: '876639945' }

function sheetCsvUrl(tab) {
  return `https://docs.google.com/spreadsheets/d/e/${SHEETS_PUBLISHED_ID}/pub?gid=${SHEETS_GIDS[tab]}&single=true&output=csv`
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseSheetDate(s) {
  if (!s) return null
  const clean = s.trim().replace(/\/\//g, '/')
  if (!clean.match(/\d/)) return null
  const parts = clean.split(/[/\-]/).filter(p => p && /^\d+$/.test(p))
  if (parts.length !== 3) return null
  let iso
  if (parts[2].length === 4) iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  else if (parts[0].length === 4) iso = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  else return null
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  const [y, m, day] = iso.split('-').map(Number)
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return null
  return iso
}

function parseOriginSheet(s) {
  const u = (s || '').toUpperCase().trim()
  if (u.includes('STORIES')) return 'Instagram Stories'
  if (u.includes('BIO')) return 'Instagram Bio'
  if (u.includes('TRÁFEGO') || u.includes('TRAFEGO')) return 'Tráfego'
  if (u.includes('INDICAÇÃO') || u.includes('INDICACAO')) return 'Indicação'
  if (u.includes('ONLINE')) return 'Outro'
  if (u.includes('CONEXÃO') || u.includes('CONEXAO')) return 'Conexão'
  return s?.trim() || ''
}

function parseMoneyValue(s) {
  if (!s || !s.trim()) return null
  const clean = s.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.').trim()
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

function genUUID() {
  return crypto.randomUUID()
}

async function fetchSheetCSV(tab) {
  const res = await fetch(sheetCsvUrl(tab))
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar aba ${tab}`)
  return res.text()
}

function parseNovosCSV(csv, clinicaId) {
  const lines = csv.split('\n').filter(l => l.trim())
  const rows = []
  for (const line of lines) {
    const cols = parseCSVLine(line)
    const rawDate = cols[0]
    if (!rawDate || !rawDate.match(/\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/)) continue
    const data = parseSheetDate(rawDate)
    if (!data) continue
    rows.push({
      id: genUUID(),
      clinica_id: clinicaId,
      data,
      nome: cols[1] || '',
      telefone: cols[2] || '',
      origem: parseOriginSheet(cols[3]),
      criativo: cols[4] || '',
      agendou: (cols[5] || '').toUpperCase() === 'SIM',
      compareceu: (cols[6] || '').toUpperCase() === 'SIM',
      vendeu: (cols[7] || '').toUpperCase() === 'SIM',
      consulta: cols[8] || '',
      valor_procedimento: parseMoneyValue(cols[9]),
      follow_up_1: parseSheetDate(cols[10]),
      follow_up_2: parseSheetDate(cols[11]),
      follow_up_3: parseSheetDate(cols[12]),
      follow_up_4: parseSheetDate(cols[13]),
      follow_up_5: parseSheetDate(cols[14]),
      observacao: cols[15] || '',
    })
  }
  return rows
}

function parseFollowupCSV(csv, clinicaId) {
  const lines = csv.split('\n').filter(l => l.trim())
  const rows = []
  for (const line of lines) {
    const cols = parseCSVLine(line)
    const rawOrigem = cols[0]
    const rawFollowup = cols[1]
    const hasDate = (rawOrigem && rawOrigem.match(/\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/)) ||
                    (rawFollowup && rawFollowup.match(/\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/))
    if (!hasDate) continue
    const data_followup = parseSheetDate(rawFollowup)
    if (!data_followup) continue
    rows.push({
      id: genUUID(),
      clinica_id: clinicaId,
      data_origem: parseSheetDate(rawOrigem),
      data_followup,
      nome: cols[2] || '',
      telefone: cols[3] || '',
      origem: parseOriginSheet(cols[4]),
      respondeu: (cols[5] || '').toUpperCase() === 'SIM',
      agendou: (cols[6] || '').toUpperCase() === 'SIM',
      vendeu: (cols[7] || '').toUpperCase() === 'SIM',
      valor: parseMoneyValue(cols[8]),
      procedimento: cols[9] || '',
      observacao: cols[10] || '',
    })
  }
  return rows
}

function parseRecorrentesCSV(csv, clinicaId) {
  const lines = csv.split('\n').filter(l => l.trim())
  const rows = []
  for (const line of lines) {
    const cols = parseCSVLine(line)
    const rawDate = cols[0]
    if (!rawDate || !rawDate.match(/\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/)) continue
    const data = parseSheetDate(rawDate)
    if (!data) continue
    rows.push({
      id: genUUID(),
      clinica_id: clinicaId,
      data,
      nome: cols[1] || '',
      telefone: cols[2] || '',
      agendou: (cols[3] || '').toUpperCase() === 'SIM',
      vendeu: (cols[4] || '').toUpperCase() === 'SIM',
      valor: parseMoneyValue(cols[5]),
      observacao: cols[6] || '',
    })
  }
  return rows
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mesAtual() {
  const hoje = new Date()
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 }
}

function prefixMes(ano, mes) {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

function rangesMes(ano, mes) {
  const ini = `${prefixMes(ano, mes)}-01`
  const proxMes = mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 }
  const fim = `${prefixMes(proxMes.ano, proxMes.mes)}-01`
  return { ini, fim }
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
    const { ini, fim } = rangesMes(a, m)

    const [
      { data: lancamentos },
      { data: agendamentos },
      { data: planilha },
    ] = await Promise.all([
      supabase.from('lancamentos').select('tipo, valor_tratamento, valor_taxa, data, procedimentos').eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim),
      supabase.from('agendamentos').select('id, status, date').eq('clinica_id', clinicaId).gte('date', ini).lt('date', fim),
      supabase.from('planilha_leads').select('agendou, compareceu, vendeu, valor_procedimento').eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim),
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
    const { ini: iniF, fim: fimF } = rangesMes(a, m)

    const { data: lancamentos } = await supabase
      .from('lancamentos')
      .select('tipo, procedimentos, valor_tratamento, valor_taxa, data, paciente, responsavel')
      .eq('clinica_id', clinicaId)
      .gte('data', iniF)
      .lt('data', fimF)
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
    const { ini: iniO, fim: fimO } = rangesMes(a, m)

    const { data: planilha } = await supabase
      .from('planilha_leads')
      .select('origem, criativo, agendou, vendeu, valor_procedimento')
      .eq('clinica_id', clinicaId)
      .gte('data', iniO)
      .lt('data', fimO)

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
      const { ini: iniP, fim: fimP } = rangesMes(ano, mes)
      const [{ data: lanc }, { data: pl }] = await Promise.all([
        supabase.from('lancamentos').select('tipo, valor_tratamento, valor_taxa').eq('clinica_id', clinicaId).gte('data', iniP).lt('data', fimP),
        supabase.from('planilha_leads').select('agendou, vendeu, valor_procedimento').eq('clinica_id', clinicaId).gte('data', iniP).lt('data', fimP),
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

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 10 — Importar planilha do Google Sheets
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'importar_planilha',
  'Importa leads do Google Sheets para o Supabase. Só afeta o mês especificado (padrão: mês atual). Nunca toca em faturamento.',
  {
    tab: z.enum(['novos', 'followup', 'recorrentes', 'todos']).optional().default('todos').describe('Qual aba importar'),
    ano: z.number().optional().describe('Ano (padrão: atual)'),
    mes: z.number().min(1).max(12).optional().describe('Mês 1-12 (padrão: atual)'),
  },
  async ({ tab, ano, mes }) => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const { ano: anoAtual, mes: mesAtualNum } = mesAtual()
    const a = ano ?? anoAtual
    const m = mes ?? mesAtualNum
    const prefix = prefixMes(a, m)
    const iniMes = `${prefix}-01`
    const [y, mo] = [a, m]
    const nextMo = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
    const fimMes = `${nextMo}-01`

    const tabs = tab === 'todos' ? ['novos', 'followup', 'recorrentes'] : [tab]
    const resultado = {}

    for (const t of tabs) {
      try {
        const csv = await fetchSheetCSV(t)

        if (t === 'novos') {
          const rows = parseNovosCSV(csv, clinicaId).filter(r => (r.data || '').startsWith(prefix))
          // Apaga mês atual e reimporta
          await supabase.from('planilha_leads').delete()
            .eq('clinica_id', clinicaId).gte('data', iniMes).lt('data', fimMes)
          let inserted = 0
          for (let i = 0; i < rows.length; i += 50) {
            const { error } = await supabase.from('planilha_leads').insert(rows.slice(i, i + 50))
            if (error) throw new Error(error.message)
            inserted += rows.slice(i, i + 50).length
          }
          resultado.novos = { importados: inserted, mes: `${String(m).padStart(2,'0')}/${a}` }

        } else if (t === 'followup') {
          const rows = parseFollowupCSV(csv, clinicaId).filter(r => (r.data_followup || '').startsWith(prefix))
          await supabase.from('planilha_followup').delete()
            .eq('clinica_id', clinicaId).gte('data_followup', iniMes).lt('data_followup', fimMes)
          let inserted = 0
          for (let i = 0; i < rows.length; i += 25) {
            const { error } = await supabase.from('planilha_followup').insert(rows.slice(i, i + 25))
            if (error) throw new Error(error.message)
            inserted += rows.slice(i, i + 25).length
          }
          resultado.followup = { importados: inserted, mes: `${String(m).padStart(2,'0')}/${a}` }

        } else if (t === 'recorrentes') {
          const rows = parseRecorrentesCSV(csv, clinicaId).filter(r => (r.data || '').startsWith(prefix))
          await supabase.from('planilha_recorrentes').delete()
            .eq('clinica_id', clinicaId).gte('data', iniMes).lt('data', fimMes)
          let inserted = 0
          for (let i = 0; i < rows.length; i += 50) {
            const { error } = await supabase.from('planilha_recorrentes').insert(rows.slice(i, i + 50))
            if (error) throw new Error(error.message)
            inserted += rows.slice(i, i + 50).length
          }
          resultado.recorrentes = { importados: inserted, mes: `${String(m).padStart(2,'0')}/${a}` }
        }
      } catch (e) {
        resultado[t] = { erro: e.message }
      }
    }

    return ok({ status: 'ok', resultado })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 11 — Diagnóstico do sistema (detecta inconsistências automaticamente)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'diagnostico_sistema',
  'Verifica inconsistências nos dados do sistema: Dashboard vs planilhas, leads desatualizados, sync atrasado. Retorna lista de problemas com sugestão de correção.',
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
    const { ini, fim } = rangesMes(a, m)

    const problemas = []
    const ok_items = []

    // 1. Verifica planilha_leads tem dados do mês
    const { data: planilhaLeads, count: countPL } = await supabase
      .from('planilha_leads').select('id, agendou, vendeu, criado_em', { count: 'exact' })
      .eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim)

    if (!countPL || countPL === 0) {
      problemas.push({ severidade: 'ERRO', area: 'Leads Novos', descricao: `Nenhum lead encontrado em ${String(m).padStart(2,'0')}/${a}`, sugestao: 'Sincronizar planilha ou importar dados manualmente' })
    } else {
      ok_items.push(`Leads Novos: ${countPL} registros em ${String(m).padStart(2,'0')}/${a}`)
      // Checa sync recente (último criado_em)
      const ultimos = (planilhaLeads || []).map(r => r.criado_em).filter(Boolean).sort().reverse()
      if (ultimos.length > 0) {
        const diasDesdeSync = Math.floor((Date.now() - new Date(ultimos[0]).getTime()) / 86400000)
        if (diasDesdeSync > 3) {
          problemas.push({ severidade: 'AVISO', area: 'Sync', descricao: `Planilha de Leads Novos não sincronizada há ${diasDesdeSync} dias`, sugestao: 'Usar ferramenta sincronizar_planilhas ou clicar em "Sincronizar" no Dashboard' })
        }
      }
    }

    // 2. Verifica planilha_followup
    const { count: countFU } = await supabase
      .from('planilha_followup').select('id', { count: 'exact' })
      .eq('clinica_id', clinicaId).gte('data_followup', ini).lt('data_followup', fim)

    if (!countFU || countFU === 0) {
      problemas.push({ severidade: 'AVISO', area: 'Follow Up', descricao: `Nenhum follow-up encontrado em ${String(m).padStart(2,'0')}/${a}`, sugestao: 'Sincronizar aba Follow Up do Google Sheets' })
    } else {
      ok_items.push(`Follow Up: ${countFU} registros`)
    }

    // 3. Verifica planilha_recorrentes
    const { count: countRec } = await supabase
      .from('planilha_recorrentes').select('id', { count: 'exact' })
      .eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim)

    if (!countRec || countRec === 0) {
      problemas.push({ severidade: 'AVISO', area: 'Recorrentes', descricao: `Nenhum recorrente encontrado em ${String(m).padStart(2,'0')}/${a}`, sugestao: 'Adicionar pacientes recorrentes na Planilha Recorrentes' })
    } else {
      ok_items.push(`Recorrentes: ${countRec} registros`)
    }

    // 4. Leads novos sem follow-up agendado há mais de 7 dias
    const corte7d = new Date(); corte7d.setDate(corte7d.getDate() - 7)
    const { data: semFollowup } = await supabase
      .from('planilha_leads').select('nome, data, follow_up_1')
      .eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim)
      .eq('agendou', false).eq('vendeu', false)
      .lt('data', corte7d.toISOString().split('T')[0])
      .is('follow_up_1', null).limit(5)

    if (semFollowup?.length > 0) {
      problemas.push({
        severidade: 'AVISO',
        area: 'Follow Up',
        descricao: `${semFollowup.length} leads sem follow-up agendado há mais de 7 dias`,
        exemplos: semFollowup.map(l => l.nome),
        sugestao: 'Agendar follow-up para esses leads na Planilha de Leads Novos',
      })
    }

    // 5. Faturamento do mês
    const { data: lancamentos } = await supabase
      .from('lancamentos').select('valor_tratamento, valor_taxa, tipo')
      .eq('clinica_id', clinicaId).gte('data', ini).lt('data', fim)
      .neq('tipo', 'Paciente Modelo')

    const totalFat = (lancamentos || []).reduce((acc, l) => acc + (l.valor_tratamento || 0) + (l.valor_taxa || 0), 0)
    if (totalFat === 0) {
      problemas.push({ severidade: 'AVISO', area: 'Faturamento', descricao: `Nenhum lançamento encontrado em ${String(m).padStart(2,'0')}/${a}`, sugestao: 'Verificar se os lançamentos foram feitos no Faturamento' })
    } else {
      ok_items.push(`Faturamento: R$ ${totalFat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    }

    return ok({
      periodo: `${String(m).padStart(2,'0')}/${a}`,
      resumo: problemas.length === 0 ? '✅ Sistema saudável — nenhum problema encontrado' : `⚠️ ${problemas.length} problema(s) detectado(s)`,
      problemas,
      ok: ok_items,
    })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 12 — Resumo diário (briefing matinal)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'resumo_diario',
  'Briefing do dia: agendamentos de hoje, faturamento de ontem, leads que precisam de atenção agora.',
  {},
  async () => {
    const clinicaId = await getClinicaId()
    if (!clinicaId) return err('clinica_id não encontrado')

    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]
    const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)
    const ontemStr = ontem.toISOString().split('T')[0]
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split('T')[0]

    const [
      { data: agendHoje },
      { data: lancOntem },
      { data: lembHoje },
      { data: followHoje },
    ] = await Promise.all([
      supabase.from('agendamentos').select('paciente, procedimento, time, status')
        .eq('clinica_id', clinicaId).eq('date', hojeStr).order('time'),
      supabase.from('lancamentos').select('valor_tratamento, valor_taxa, paciente, tipo')
        .eq('clinica_id', clinicaId).eq('data', ontemStr).neq('tipo', 'Paciente Modelo'),
      supabase.from('lembretes').select('lead_nome, descricao, data')
        .eq('clinica_id', clinicaId).eq('data', hojeStr).eq('concluido', false),
      supabase.from('planilha_leads').select('nome, telefone, follow_up_1, follow_up_2, follow_up_3')
        .eq('clinica_id', clinicaId).or(`follow_up_1.eq.${hojeStr},follow_up_2.eq.${hojeStr},follow_up_3.eq.${hojeStr}`),
    ])

    const fatOntem = (lancOntem || []).reduce((acc, l) => acc + (l.valor_tratamento || 0) + (l.valor_taxa || 0), 0)

    const followUpsHoje = (followHoje || []).map(l => ({
      nome: l.nome,
      telefone: l.telefone,
    }))

    return ok({
      data: hojeStr,
      agendamentos_hoje: {
        total: (agendHoje || []).length,
        lista: (agendHoje || []).map(a => ({ hora: a.time, paciente: a.paciente, procedimento: a.procedimento, status: a.status })),
      },
      faturamento_ontem: {
        total: fatOntem,
        formatado: `R$ ${fatOntem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        lancamentos: (lancOntem || []).length,
      },
      follow_ups_hoje: {
        total: followUpsHoje.length,
        leads: followUpsHoje,
      },
      lembretes_hoje: {
        total: (lembHoje || []).length,
        lista: (lembHoje || []).map(l => ({ lead: l.lead_nome, descricao: l.descricao })),
      },
    })
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 13 — Sincronizar planilhas (aciona o sync sem precisar abrir o Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
server.tool(
  'sincronizar_planilhas',
  'Dispara a sincronização das planilhas do Google Sheets (Leads Novos + Follow Up) para o mês especificado.',
  {
    ano: z.number().optional(),
    mes: z.number().min(1).max(12).optional(),
  },
  async ({ ano, mes }) => {
    const { ano: anoAtual, mes: mesAtualNum } = mesAtual()
    const a = ano ?? anoAtual
    const m = mes ?? mesAtualNum

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://draamandaliima.com.br'

    try {
      const res = await fetch(`${baseUrl}/api/sync-planilha?ano=${a}&mes=${m}`)
      const data = await res.json()
      if (data.ok) {
        return ok({ status: 'sucesso', periodo: `${String(m).padStart(2,'0')}/${a}`, resultado: data.resultado })
      } else {
        return err(`Sync falhou: ${data.error || 'erro desconhecido'}`)
      }
    } catch (e) {
      return err(`Erro ao chamar sync: ${e.message}`)
    }
  }
)

// ── Inicia o servidor ─────────────────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)
