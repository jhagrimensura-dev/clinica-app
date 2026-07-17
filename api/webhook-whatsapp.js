function extrairTexto(body) {
  if (body?.text?.message) return body.text.message
  if (typeof body?.message === 'string' && body.message) return body.message
  if (body?.conversation) return body.conversation
  if (body?.extendedTextMessage?.text) return body.extendedTextMessage.text
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
    const instanciaId = req.query.i || payload?.instanceId
    if (!instanciaId) return res.status(200).json({ ok: true, skipped: true })

    const deMin = payload?.fromMe ?? false
    const rawPhone = payload?.phone || ''
    const rawChatId = (payload?.chatId || '').replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '')
    const isLidPhone = rawPhone.includes('@lid')
    let phone = deMin
      ? (rawChatId || rawPhone.replace(/@.*/g, ''))
      : ((rawPhone && !rawPhone.includes('@') && /^\d+$/.test(rawPhone))
          ? rawPhone
          : rawChatId || rawPhone.replace(/@.*/g, ''))
    const messageId = payload?.messageId || payload?.id
    const texto = extrairTexto(payload)
    const mediaUrl = extrairMediaUrl(payload)
    const chatName = payload?.chatName || null
    const nomeContato = chatName || payload?.senderName || phone
    const tsRaw = payload?.momment || payload?.timestamp || Date.now()
    const ref = payload?.referral || payload?.referralAd || null
    const referralAnuncio = ref ? (ref.headline || ref.body || ref.title || ref.source || null) : null
    const referralThumbnail = ref?.thumbnailUrl || ref?.thumbnail || null
    const ts = Number(tsRaw) < 10000000000 ? Number(tsRaw) * 1000 : Number(tsRaw)

    console.log('[WH]', JSON.stringify({ phone: rawPhone, chatId: payload?.chatId, chatName, fromMe: deMin, type: payload?.type, texto: texto?.slice(0, 60), instancia: instanciaId }))

    if (!texto) return res.status(200).json({ ok: true, skipped: true })

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

    // Para mensagens enviadas pelo celular com phone @lid (sem chatId), resolve o telefone real do destinatário
    if (deMin && isLidPhone) {
      try {
        const iid = encodeURIComponent(instanciaId)
        let foundPhone = null

        // Opção 1: chatName é um número de telefone → usa diretamente
        if (chatName) {
          const chatNameDigits = chatName.replace(/[\s\-\+\(\)]/g, '')
          if (/^\d{8,15}$/.test(chatNameDigits)) {
            foundPhone = chatNameDigits
          }
        }

        // Opção 2: lookup por chatName no histórico de mensagens recebidas
        if (!foundPhone && chatName && chatName !== phone) {
          const nc = encodeURIComponent(chatName)
          const lookupRes = await fetch(
            `${SUPABASE_URL}/rest/v1/whatsapp_mensagens?instancia_id=eq.${iid}&nome_contato=eq.${nc}&de_mim=eq.false&select=phone&limit=1`,
            { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
          )
          const lookupData = await lookupRes.json()
          foundPhone = lookupData?.[0]?.phone || null
        }

        // Opção 3: busca no chat list do Z-API pelo nome do contato
        if (!foundPhone && chatName) {
          try {
            const confRes = await fetch(
              `${SUPABASE_URL}/rest/v1/configuracoes?chave=eq.config_whatsapp_contas&select=valor`,
              { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            )
            const confData = await confRes.json()
            let zapiToken = null
            let zapiClientToken = null
            for (const row of (confData || [])) {
              try {
                const contas = JSON.parse(row.valor)
                const conta = Array.isArray(contas) ? contas.find(c => c.instanciaId === instanciaId) : null
                if (conta) { zapiToken = conta.instanciaToken; zapiClientToken = conta.clientToken || null; break }
              } catch (_) {}
            }
            if (zapiToken) {
              const zapiHeaders = { 'Content-Type': 'application/json', ...(zapiClientToken ? { 'client-token': zapiClientToken } : {}) }
              const chatsRes = await fetch(
                `https://api.z-api.io/instances/${encodeURIComponent(instanciaId)}/token/${encodeURIComponent(zapiToken)}/chats?page=1&pageSize=100`,
                { headers: zapiHeaders }
              )
              const chatsData = await chatsRes.json()
              const lista = Array.isArray(chatsData) ? chatsData : Array.isArray(chatsData?.value) ? chatsData.value : []
              const chat = lista.find(c => c.name === chatName)
              if (chat?.phone) {
                const cleaned = (chat.phone || '').replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '').replace(/@lid$/, '')
                if (cleaned && /^\d+$/.test(cleaned)) foundPhone = cleaned
              }
              if (foundPhone) console.log('[WH-SENT-ZAPI]', JSON.stringify({ chatName, resolvedPhone: foundPhone }))
            }
          } catch (_) {}
        }

        if (foundPhone) {
          console.log('[WH-SENT]', JSON.stringify({ chatName, resolvedPhone: foundPhone, via: foundPhone === chatName?.replace(/[\s\-\+\(\)]/g, '') ? 'direto' : 'lookup' }))
          phone = foundPhone
        } else {
          console.log('[WH-SENT-NORESOLVE]', JSON.stringify({ chatName, phone }))
        }
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
        instancia_id: instanciaId,
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
