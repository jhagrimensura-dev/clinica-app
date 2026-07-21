export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { secret } = req.body || {}
  if (secret !== 'amanda2025migrate') return res.status(403).json({ error: 'forbidden' })

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  // Lê contas atuais
  const getRes = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?chave=eq.config_whatsapp_contas&select=valor`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  })
  const rows = await getRes.json()
  const contas = rows?.[0]?.valor || []

  if (contas.length === 0) {
    // Sem contas — cria do zero com as duas instâncias
    const novas = [
      { id: 'leads-novos-1', nome: 'Leads Novos', tipo: 'Leads Novos', instanciaId: 'leads-novos' },
      { id: 'recorrente-1', nome: 'Leads Recorrentes', tipo: 'Leads Recorrentes', instanciaId: 'recorrente' },
    ]
    await fetch(`${SUPABASE_URL}/rest/v1/configuracoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ chave: 'config_whatsapp_contas', valor: novas }),
    })
    return res.status(200).json({ ok: true, action: 'created', contas: novas })
  }

  // Atualiza instanciaId das contas existentes por tipo
  const atualizadas = contas.map(c => {
    if (c.tipo === 'Leads Novos') return { ...c, instanciaId: 'leads-novos' }
    if (c.tipo === 'Leads Recorrentes') return { ...c, instanciaId: 'recorrente' }
    return c
  })

  await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?chave=eq.config_whatsapp_contas`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ valor: atualizadas }),
  })

  res.status(200).json({ ok: true, action: 'updated', antes: contas, depois: atualizadas })
}
