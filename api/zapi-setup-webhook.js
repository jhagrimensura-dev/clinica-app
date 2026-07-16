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

  // Tenta configurar webhook de mensagens RECEBIDAS (testa PUT e POST)
  const receivedEndpoints = [
    { method: 'PUT', path: 'update-webhook-received' },
    { method: 'POST', path: 'webhook-received' },
    { method: 'PUT', path: 'webhook-received' },
  ]
  for (const { method, path } of receivedEndpoints) {
    try {
      const r = await fetch(`https://api.z-api.io/instances/${i}/token/${t}/${path}`, {
        method,
        headers,
        body: JSON.stringify({ value: webhookUrl, url: webhookUrl }),
      })
      const body = await r.json().catch(() => ({}))
      results.received = { status: r.status, body, method, path }
      if (r.status === 200 && !body.error) break
    } catch (e) {
      results.received = { error: e.message }
    }
  }

  // Tenta configurar webhook de mensagens ENVIADAS (pelo celular)
  const sendEndpoints = [
    { method: 'PUT', path: 'update-webhook-send' },
    { method: 'POST', path: 'update-webhook-send' },
    { method: 'PUT', path: 'webhook-send' },
    { method: 'POST', path: 'webhook-send' },
  ]
  for (const { method, path } of sendEndpoints) {
    try {
      const r = await fetch(`https://api.z-api.io/instances/${i}/token/${t}/${path}`, {
        method,
        headers,
        body: JSON.stringify({ value: webhookUrl, url: webhookUrl }),
      })
      const body = await r.json().catch(() => ({}))
      results.send = { status: r.status, body, method, path }
      if (r.status === 200 && !body.error) break
    } catch (e) {
      results.send = { error: e.message }
    }
  }

  console.log('[WEBHOOK-SETUP]', JSON.stringify({ webhookUrl, results }))
  res.json({ webhookUrl, results })
}
