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
  if (body?.audio?.audioUrl) return body.audio.audioUrl
  if (body?.audio?.url) return body.audio.url
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const payload = req.body
    const instanciaId = req.query.i

    const rawPhone = payload?.phone || ''
    const rawChatId = (payload?.chatId || '').replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '')
    const isLidPhone = rawPhone.includes('@lid')
    let phone = (rawPhone && !rawPhone.includes('@') && /^\d+$/.test(rawPhone))
      ? rawPhone
      : rawChatId || rawPhone.replace(/@.*/g, '')
    const messageId = payload?.messageId || payload?.id
    const deMin = payload?.fromMe ?? false
    const texto = extrairTexto(payload)
    const mediaUrl = extrairMediaUrl(payload)
    // Prioriza chatName (nome salvo no celular) para que enviados e recebidos do mesmo chat sejam consistentes
    const nomeContato = payload?.chatName || payload?.senderName || phone
    const tsRaw = payload?.momment || payload?.timestamp || Date.now()
    // Anúncio de origem (Click-to-WhatsApp ads)
    const ref = payload?.referral || payload?.referralAd || null
    const referralAnuncio = ref
      ? (ref.headline || ref.body || ref.title || ref.source || null)
      : null
    const referralThumbnail = ref?.thumbnailUrl || ref?.thumbnail || null
    const ts = Number(tsRaw) < 10000000000 ? Number(tsRaw) * 1000 : Number(tsRaw)

    console.log('[WH]', JSON.stringify({ phone: rawPhone, chatId: payload?.chatId, fromMe: deMin, type: payload?.type, texto: texto?.slice(0, 50), instancia: instanciaId }))
    if (!texto) return res.status(200).json({ ok: true, skipped: true })

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

    // Para mensagens enviadas pelo celular (@lid), busca o telefone real pelo nome do chat
    if (deMin && isLidPhone && nomeContato && nomeContato !== phone) {
      try {
        const iid = encodeURIComponent(instanciaId || payload?.instanceId || '')
        const nc = encodeURIComponent(nomeContato)
        const lookupRes = await fetch(
          `${SUPABASE_URL}/rest/v1/whatsapp_mensagens?instancia_id=eq.${iid}&nome_contato=eq.${nc}&de_mim=eq.false&select=phone&limit=1`,
          { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
        )
        const lookupData = await lookupRes.json()
        if (lookupData?.[0]?.phone) phone = lookupData[0].phone
      } catch (_) {}
    }

    if (!phone) return res.status(200).json({ ok: true, skipped: true })

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
