function extrairTexto(message, messageType) {
  if (!message) return null
  if (message.conversation) return message.conversation
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text
  if (message.imageMessage) return message.imageMessage.caption || '[imagem]'
  if (message.videoMessage) return message.videoMessage.caption || '[vídeo]'
  if (message.documentMessage) return message.documentMessage.caption || message.documentMessage.fileName || '[documento]'
  if (message.audioMessage) return '[áudio]'
  if (message.stickerMessage) return '[sticker]'
  if (message.reactionMessage) return null
  if (messageType === 'conversation') return null
  return null
}

function extrairMediaUrl(message) {
  if (message?.imageMessage?.url) return message.imageMessage.url
  if (message?.videoMessage?.url) return message.videoMessage.url
  if (message?.documentMessage?.url) return message.documentMessage.url
  if (message?.audioMessage?.url) return message.audioMessage.url
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const payload = req.body
    const event = payload?.event

    if (event !== 'messages.upsert') return res.status(200).json({ ok: true, skipped: true })

    const instanciaId = payload?.instance || req.query.i
    if (!instanciaId) return res.status(200).json({ ok: true, skipped: true })

    const data = payload?.data
    const key = data?.key
    const remoteJid = key?.remoteJid || ''

    // Ignora grupos
    if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) {
      return res.status(200).json({ ok: true, skipped: true })
    }

    const phone = remoteJid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '')
    if (!phone || !/^\d+$/.test(phone)) return res.status(200).json({ ok: true, skipped: true })

    const deMin = key?.fromMe ?? false
    const messageId = key?.id
    const message = data?.message
    const messageType = data?.messageType
    const texto = extrairTexto(message, messageType)
    const mediaUrl = extrairMediaUrl(message)
    const nomeContato = data?.pushName || phone
    const tsRaw = data?.messageTimestamp || Date.now()
    const ts = Number(tsRaw) < 10000000000 ? Number(tsRaw) * 1000 : Number(tsRaw)

    // Referral de anúncio
    const ctxInfo = message?.extendedTextMessage?.contextInfo
      || message?.imageMessage?.contextInfo
      || message?.videoMessage?.contextInfo
      || null
    const referralAnuncio = ctxInfo?.externalAdReply?.title || ctxInfo?.externalAdReply?.body || null
    const referralThumbnail = ctxInfo?.externalAdReply?.thumbnailUrl || null

    console.log('[WH-EVO]', JSON.stringify({ phone, fromMe: deMin, type: messageType, texto: texto?.slice(0, 60), instancia: instanciaId }))

    if (!texto) return res.status(200).json({ ok: true, skipped: true })

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

    console.log('[WH-SAVE]', JSON.stringify({ phone, deMin, nomeContato, texto: texto?.slice(0, 40) }))

    await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_mensagens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=ignore-duplicates',
      },
      body: JSON.stringify({
        instancia_id: instanciaId,
        phone,
        nome_contato: nomeContato,
        message_id: messageId,
        de_mim: deMin,
        texto,
        tipo: messageType || 'text',
        media_url: mediaUrl || null,
        timestamp_ms: ts,
        referral_anuncio: referralAnuncio || null,
        referral_thumbnail: referralThumbnail || null,
      }),
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e.message)
    res.status(200).json({ ok: true })
  }
}
