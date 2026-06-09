import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

function extrairTexto(body) {
  return body?.text?.message
    || body?.image?.caption
    || body?.video?.caption
    || body?.document?.caption
    || body?.audio ? '[áudio]' : null
    || body?.sticker ? '[sticker]' : null
    || body?.document?.fileName
    || null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const payload = req.body
    const instanciaId = req.query.i

    // Z-API envia diferentes tipos de eventos
    const tipo = payload?.type || payload?.instanceId ? 'message' : null
    const phone = payload?.phone || payload?.chatId?.replace('@s.whatsapp.net', '')
    const messageId = payload?.messageId || payload?.id
    const deMin = payload?.fromMe ?? false
    const texto = extrairTexto(payload)
    const nomeContato = payload?.senderName || payload?.chatName || phone
    const ts = payload?.momment || payload?.timestamp || Date.now()

    if (!phone || !texto) return res.status(200).json({ ok: true, skipped: true })

    await supabase.from('whatsapp_mensagens').upsert({
      instancia_id: instanciaId || payload?.instanceId || '',
      phone,
      nome_contato: nomeContato,
      message_id: messageId,
      de_mim: deMin,
      texto,
      tipo: payload?.type || 'text',
      timestamp_ms: Number(ts),
    }, { onConflict: 'message_id', ignoreDuplicates: true })

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e.message)
    res.status(200).json({ ok: true }) // sempre 200 para Z-API não retentar
  }
}
