import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Deleta os 37 duplicados inseridos hoje às 20:04:09 UTC pelo bug da migração localStorage
  const { data, error, count } = await sb
    .from('lancamentos')
    .delete({ count: 'exact' })
    .like('id', 'venda_1782242455408_%')

  if (error) return res.status(500).json({ error: error.message })

  // Verifica total restante
  const { data: restante } = await sb
    .from('lancamentos')
    .select('id,valor_tratamento,valor_taxa')
    .like('data', '2026-06%')

  const totalTrat = restante.reduce((a, l) => a + (l.valor_tratamento || 0), 0)
  const totalTaxa = restante.reduce((a, l) => a + (l.valor_taxa || 0), 0)

  res.json({
    deletados: count,
    restantes: restante.length,
    totalTratamento: totalTrat,
    totalTaxa: totalTaxa,
    totalGeral: totalTrat + totalTaxa
  })
}
