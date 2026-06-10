function extrairTexto(body) {
  if (body?.text?.message) return body.text.message
  if (body?.image) return body.image.caption || '[imagem]'
  if (body?.video) return body.video.caption || '[vídeo]'
  if (body?.document) return body.document.caption || body.document.fileName || '[documento]'
  if (body?.audio) return '[áudio]'
  if (body?.sticker) return '[sticker]'
  return null
}

function extrairMediaUrl(body) {
  if (body?.image?.imageUrl) return body.image.imageUrl
  if (body?.image?.url) return body.image.url
  if (body?.video?.videoUrl) return body.video.videoUrl
  if (body?.video?.url) return body.video.url
  if (body?.document?.documentUrl) return body.document.documentUrl
  if (body?.document?.url) return body.document.url
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
    const mediaUrl = extrairMediaUrl(payload)
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
        media_url: mediaUrl || null,
        timestamp_ms: Number(ts),
      }),
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e.message)
    res.status(200).json({ ok: true })
  }
}
