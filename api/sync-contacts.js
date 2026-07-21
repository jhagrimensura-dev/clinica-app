const EVO_URL = 'https://evolution-api-production-1083.up.railway.app'
const EVO_KEY = 'Amanda@2025!'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  const instancias = ['leads-novos', 'recorrente']
  const resultados = {}

  for (const inst of instancias) {
    try {
      const r = await fetch(`${EVO_URL}/chat/findContacts/${inst}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
        body: JSON.stringify({ where: {} }),
      })
      const contatos = await r.json()
      const lista = Array.isArray(contatos) ? contatos : []

      const mapa = {}
      for (const c of lista) {
        const jid = c.remoteJid || ''
        const nome = c.pushName || c.name || ''
        if (jid && nome && !/^\d{10,}$/.test(nome)) mapa[jid] = nome
      }

      const chave = `whatsapp_contacts_${inst}`
      await fetch(`${SUPABASE_URL}/rest/v1/configuracoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ chave, valor: mapa }),
      })

      resultados[inst] = Object.keys(mapa).length
    } catch (e) {
      resultados[inst] = `erro: ${e.message}`
    }
  }

  res.status(200).json({ ok: true, resultados })
}
