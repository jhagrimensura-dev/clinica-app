export default async function handler(req, res) {
  const { i, t, ct } = req.query
  if (!i || !t) return res.status(400).json({ error: 'Missing params' })

  res.setHeader('Cache-Control', 'no-cache, no-store')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const url = `https://api.z-api.io/instances/${i}/token/${t}/qr-code`
    const headers = { 'Content-Type': 'application/json', ...(ct ? { 'client-token': ct } : {}) }

    const response = await fetch(url, { headers })
    const text = await response.text()

    console.log('Z-API QR status:', response.status)
    console.log('Z-API QR response (first 500):', text.slice(0, 500))

    if (!response.ok) {
      return res.status(response.status).json({ error: `Z-API ${response.status}`, raw: text.slice(0, 300) })
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      // resposta não é JSON — pode ser PNG direto
      if (text.length > 0) {
        const b64 = Buffer.from(text, 'binary').toString('base64')
        return res.json({ value: `data:image/png;base64,${b64}` })
      }
      return res.status(500).json({ error: 'Invalid JSON from Z-API', raw: text.slice(0, 300) })
    }

    const rawValue = data?.value || data?.qrcode || data?.qr || null
    console.log('Z-API QR value prefix:', String(rawValue).slice(0, 80))

    if (rawValue && typeof rawValue === 'string') {
      // URL externa — faz proxy para evitar CORS
      if (rawValue.startsWith('http')) {
        const imgRes = await fetch(rawValue, { headers: ct ? { 'client-token': ct } : {} })
        const imgBuffer = await imgRes.arrayBuffer()
        const contentType = imgRes.headers.get('content-type') || 'image/png'
        const b64 = Buffer.from(imgBuffer).toString('base64')
        return res.json({ value: `data:${contentType};base64,${b64}` })
      }
      // Base64 sem prefixo data URI
      if (!rawValue.startsWith('data:')) {
        return res.json({ value: `data:image/png;base64,${rawValue}` })
      }
    }

    res.json(data)
  } catch (e) {
    console.error('QR proxy error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
