function extrairTexto(body) {
  if (body?.text?.message) return body.text.message
  if (body?.image?.caption) return body.image.caption
  if (body?.video?.caption) return body.video.caption
  if (body?.document?.caption) return body.document.caption
  if (body?.document?.fileName) return body.document.fileName
  if (body?.audio) return '[áudio]'
  if (body?.sticker) return '[sticker]'
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const payload = req.body
    const instanciaId = req.query.i

    const phone = payload?.phone || payload?.chatId?.replace('@s.whatsapp.net', '')
    const messageId = payload?.messageId || payload?.id
    const deMin = payload?.fromMe ?? false
    const texto = extrairTexto(payload)
    const nomeContato = payload?.senderName || payload?.chatName || phone
    const ts = payload?.momment || payload?.timestamp || Date.now()

    if (!phone || !texto) return res.status(200).json({ ok: true, skipped: true })

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

    await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_mensagens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=ignore-duplicates',
      },
      body: JSON.stringify({
        instancia_id: instanciaId || payload?.instanceId || '',
        phone,
        nome_contato: nomeContato,
        message_id: messageId,
        de_mim: deMin,
        texto,
        tipo: payload?.type || 'text',
        timestamp_ms: Number(ts),
      }),
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e.message)
    res.status(200).json({ ok: true })
  }
}
