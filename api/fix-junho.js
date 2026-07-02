import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await sb
    .from('lancamentos')
    .select('id,data,paciente,tipo,procedimentos,valor_tratamento,valor_taxa,criado_em')
    .like('data', '2026-06%')
    .order('criado_em', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const totalTrat = data.reduce((a, l) => a + (l.valor_tratamento || 0), 0)
  const totalTaxa = data.reduce((a, l) => a + (l.valor_taxa || 0), 0)

  // Detectar duplicatas: mesmo paciente + data + procedimentos
  const seen = {}
  const duplicatas = []
  const unicos = []
  for (const l of data) {
    const key = `${l.paciente}|${l.data}|${l.procedimentos}`
    if (seen[key]) {
      duplicatas.push(l)
    } else {
      seen[key] = true
      unicos.push(l)
    }
  }

  res.json({
    total: data.length,
    totalTratamento: totalTrat,
    totalTaxa: totalTaxa,
    totalGeral: totalTrat + totalTaxa,
    duplicatas: duplicatas.length,
    lancamentos: data.map(l => ({
      id: l.id,
      data: l.data,
      paciente: l.paciente,
      tipo: l.tipo,
      proc: l.procedimentos?.slice(0, 40),
      trat: l.valor_tratamento,
      taxa: l.valor_taxa,
      criado: l.criado_em
    }))
  })
}
