export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { i, t, ct, baseUrl } = req.body
  if (!i || !t || !baseUrl) return res.status(400).json({ error: 'Missing params' })

  const webhookUrl = `${baseUrl}/api/webhook-whatsapp?i=${i}`
  const headers = {
    'Content-Type': 'application/json',
    ...(ct ? { 'client-token': ct } : {}),
  }

  const results = {}

  // Configura webhook de mensagens RECEBIDAS
  try {
    const r = await fetch(`https://api.z-api.io/instances/${i}/token/${t}/update-webhook-received`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ value: webhookUrl }),
    })
    results.received = { status: r.status, body: await r.json().catch(() => ({})) }
  } catch (e) {
    results.received = { error: e.message }
  }

  // Configura webhook de mensagens ENVIADAS (pelo celular)
  try {
    const r = await fetch(`https://api.z-api.io/instances/${i}/token/${t}/update-webhook-send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ value: webhookUrl }),
    })
    results.send = { status: r.status, body: await r.json().catch(() => ({})) }
  } catch (e) {
    results.send = { error: e.message }
  }

  console.log('[WEBHOOK-SETUP]', JSON.stringify({ webhookUrl, results }))
  res.json({ webhookUrl, results })
}
