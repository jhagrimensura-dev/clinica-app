import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const sb = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
  const { error } = await sb
    .from('configuracoes')
    .upsert({ chave: 'app_force_reload', valor: String(Date.now()) }, { onConflict: 'chave' })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true, ts: Date.now() })
}
