export default async function handler(req, res) {
  const { i, t } = req.query
  if (!i || !t) return res.status(400).json({ error: 'Missing params' })

  res.setHeader('Cache-Control', 'no-cache, no-store')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const url = `https://api.z-api.io/instances/${i}/token/${t}/qr-code`
    console.log('Fetching Z-API:', url)

    const response = await fetch(url, {
      headers: { 'client-token': t }
    })

    const text = await response.text()
    console.log('Z-API status:', response.status)
    console.log('Z-API response (first 300):', text.slice(0, 300))

    if (!response.ok) {
      return res.status(response.status).json({ error: `Z-API ${response.status}`, raw: text.slice(0, 300) })
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      return res.status(500).json({ error: 'Invalid JSON from Z-API', raw: text.slice(0, 300) })
    }

    res.json(data)
  } catch (e) {
    console.error('Proxy error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
