import { createClient } from '@supabase/supabase-js'

const PUBLISHED_ID = '2PACX-1vSQHBxm7a-u_r5dMNrZtYoMHRs3awELyB968s8aqj0HcJSeP1PjnE3n_FWZ8bB54BeFNVc3Syv0E5Fr'
const GIDS = { novos: '574898400', followup: '1573659618', recorrentes: '876639945' }

function parseCSVLine(line) {
  const result = []; let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else current += ch
  }
  result.push(current.trim()); return result
}

function parseSheetDate(s) {
  if (!s) return null
  const clean = s.trim().replace(/\/\//g, '/')
  if (!clean.match(/[0-9]/)) return null
  const parts = clean.split(/[/\-]/).filter(p => p && /^[0-9]+$/.test(p))
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

function parseOrigin(s) {
  const u = (s || '').toUpperCase().trim()
  if (u.includes('STORIES')) return 'Instagram Stories'
  if (u.includes('BIO')) return 'Instagram Bio'
  if (u.includes('TRAFEGO') || u.includes('TRÁFEGO')) return 'Tráfego'
  if (u.includes('INDICA')) return 'Indicação'
  if (u.includes('ONLINE')) return 'Outro'
  if (u.includes('CONEX')) return 'Conexão'
  return s?.trim() || ''
}

function parseMoney(s) {
  if (!s || !s.trim()) return null
  const clean = s.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.').trim()
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

async function fetchCSV(tab) {
  const url = `https://docs.google.com/spreadsheets/d/e/${PUBLISHED_ID}/pub?gid=${GIDS[tab]}&single=true&output=csv`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar aba ${tab}`)
  return res.text()
}

export default async function handler(req, res) {
  // Vercel cron injeta o header Authorization automaticamente
  const authHeader = req.headers['authorization']
  const cronSecret = process.env.CRON_SECRET
  // Bloqueia apenas se o header estiver presente e errado (permite chamadas sem auth do Dashboard)
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://cojduxlqjwskfqqfximo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  )

  // Detecta clinica_id
  let clinicaId = process.env.CLINICA_ID
  if (!clinicaId) {
    const { data } = await supabase.from('clinica_master').select('admin_id').limit(1).maybeSingle()
    clinicaId = data?.admin_id
  }
  if (!clinicaId) return res.status(500).json({ error: 'clinica_id não encontrado' })

  // Mês/ano: usa query params se fornecidos, senão mês atual (Brasília = UTC-3)
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const ano = parseInt(req.query?.ano) || agora.getUTCFullYear()
  const mes = parseInt(req.query?.mes) || (agora.getUTCMonth() + 1)
  const prefix = `${ano}-${String(mes).padStart(2, '0')}`
  const iniMes = `${prefix}-01`
  const nextMes = mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, '0')}`
  const fimMes = `${nextMes}-01`

  const resultado = {}

  try {
    // ── Leads Novos ──────────────────────────────────────────────────────────
    const csvNovos = await fetchCSV('novos')
    const rowsNovos = []
    for (const line of csvNovos.split('\n').filter(l => l.trim())) {
      const cols = parseCSVLine(line)
      const data = parseSheetDate(cols[0])
      if (!data || !data.startsWith(prefix)) continue
      rowsNovos.push({
        id: crypto.randomUUID(), clinica_id: clinicaId, data,
        nome: cols[1] || '', telefone: cols[2] || '',
        origem: parseOrigin(cols[3]), criativo: cols[4] || '',
        agendou: (cols[5] || '').toUpperCase() === 'SIM',
        compareceu: (cols[6] || '').toUpperCase() === 'SIM',
        vendeu: (cols[7] || '').toUpperCase() === 'SIM',
        consulta: cols[8] || '',
        valor_procedimento: parseMoney(cols[9]),
        follow_up_1: parseSheetDate(cols[10]), follow_up_2: parseSheetDate(cols[11]),
        follow_up_3: parseSheetDate(cols[12]), follow_up_4: parseSheetDate(cols[13]),
        follow_up_5: parseSheetDate(cols[14]), observacao: cols[15] || '',
      })
    }
    // Apaga leads órfãos do mês (que perderam o vínculo com planilha_leads)
    const { data: planilhaAntes } = await supabase.from('planilha_leads').select('id').eq('clinica_id', clinicaId).gte('data', iniMes).lt('data', fimMes)
    if (planilhaAntes?.length) {
      const idsAntigos = planilhaAntes.map(r => r.id)
      for (let i = 0; i < idsAntigos.length; i += 50)
        await supabase.from('leads').delete().in('id', idsAntigos.slice(i, i + 50))
    }
    await supabase.from('planilha_leads').delete().eq('clinica_id', clinicaId).gte('data', iniMes).lt('data', fimMes)
    for (let i = 0; i < rowsNovos.length; i += 50) {
      const { error } = await supabase.from('planilha_leads').insert(rowsNovos.slice(i, i + 50))
      if (error) throw new Error(`planilha_leads: ${error.message}`)
    }
    resultado.novos = rowsNovos.length

    // ── Follow Up ─────────────────────────────────────────────────────────────
    const csvFU = await fetchCSV('followup')
    const rowsFU = []
    for (const line of csvFU.split('\n').filter(l => l.trim())) {
      const cols = parseCSVLine(line)
      const rawOrigem = cols[0], rawFollowup = cols[1]
      const hasDate = (rawOrigem && rawOrigem.match(/[0-9]{1,2}[/\-][0-9]{1,2}[/\-][0-9]{2,4}/)) ||
                      (rawFollowup && rawFollowup.match(/[0-9]{1,2}[/\-][0-9]{1,2}[/\-][0-9]{2,4}/))
      if (!hasDate) continue
      const data_followup = parseSheetDate(rawFollowup)
      if (!data_followup || !data_followup.startsWith(prefix)) continue
      rowsFU.push({
        id: crypto.randomUUID(), clinica_id: clinicaId,
        data_origem: parseSheetDate(rawOrigem), data_followup,
        nome: cols[2] || '', telefone: cols[3] || '',
        origem: parseOrigin(cols[4]),
        respondeu: (cols[5] || '').toUpperCase() === 'SIM',
        agendou: (cols[6] || '').toUpperCase() === 'SIM',
        vendeu: (cols[7] || '').toUpperCase() === 'SIM',
        valor: parseMoney(cols[8]), procedimento: cols[9] || '', observacao: cols[10] || '',
      })
    }
    // Apaga leads órfãos de followup do mês
    const { data: fuAntes } = await supabase.from('planilha_followup').select('id').eq('clinica_id', clinicaId).gte('data_followup', iniMes).lt('data_followup', fimMes)
    if (fuAntes?.length) {
      const idsFU = fuAntes.map(r => r.id)
      for (let i = 0; i < idsFU.length; i += 50)
        await supabase.from('leads').delete().in('id', idsFU.slice(i, i + 50))
    }
    await supabase.from('planilha_followup').delete().eq('clinica_id', clinicaId).gte('data_followup', iniMes).lt('data_followup', fimMes)
    for (let i = 0; i < rowsFU.length; i += 25) {
      const { error } = await supabase.from('planilha_followup').insert(rowsFU.slice(i, i + 25))
      if (error) throw new Error(`planilha_followup: ${error.message}`)
    }
    // Sincroniza followup → leads
    const leadsFollowup = rowsFU.filter(r => r.nome?.trim()).map(r => {
      const status = r.vendeu ? 'fechado' : r.agendou ? 'agendado' : r.respondeu ? 'conversando' : 'em_aberto'
      return {
        id: r.id, clinica_id: clinicaId, nome: r.nome, telefone: r.telefone || '',
        origem: 'leads_followup', origem_custom: r.origem || '',
        data: r.data_followup || '', data_origem: '',
        status, obs: r.observacao || '', midia: r.origem || null,
        responsavel: '', fonte: '', agendado_para: null, proximo_followup: '',
      }
    })
    for (let i = 0; i < leadsFollowup.length; i += 25) {
      const { error } = await supabase.from('leads').upsert(leadsFollowup.slice(i, i + 25), { onConflict: 'id' })
      if (error) throw new Error(`leads followup: ${error.message}`)
    }
    resultado.followup = rowsFU.length

    // ── Recorrentes ───────────────────────────────────────────────────────────
    const csvRec = await fetchCSV('recorrentes')
    const rowsRec = []
    for (const line of csvRec.split('\n').filter(l => l.trim())) {
      const cols = parseCSVLine(line)
      const data = parseSheetDate(cols[0])
      if (!data || !data.startsWith(prefix)) continue
      rowsRec.push({
        id: crypto.randomUUID(), clinica_id: clinicaId, data,
        nome: cols[1] || '', telefone: cols[2] || '',
        agendou: (cols[3] || '').toUpperCase() === 'SIM',
        vendeu: (cols[4] || '').toUpperCase() === 'SIM',
        valor: parseMoney(cols[5]), observacao: cols[6] || '',
      })
    }
    await supabase.from('planilha_recorrentes').delete().eq('clinica_id', clinicaId).gte('data', iniMes).lt('data', fimMes)
    for (let i = 0; i < rowsRec.length; i += 50) {
      const { error } = await supabase.from('planilha_recorrentes').insert(rowsRec.slice(i, i + 50))
      if (error) throw new Error(`planilha_recorrentes: ${error.message}`)
    }
    resultado.recorrentes = rowsRec.length

    return res.status(200).json({ ok: true, periodo: prefix, resultado })
  } catch (e) {
    console.error('sync-planilha error:', e.message)
    return res.status(500).json({ ok: false, error: e.message })
  }
}
