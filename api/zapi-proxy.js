export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { i, t, path, ct } = req.query
  if (!i || !t || !path) return res.status(400).json({ error: 'Missing params' })

  try {
    const url = `https://api.z-api.io/instances/${i}/token/${t}/${path}`
    const isPost = req.method === 'POST'

    const response = await fetch(url, {
      method: isPost ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(ct ? { 'client-token': ct } : {}),
      },
      ...(isPost && req.body ? { body: JSON.stringify(req.body) } : {}),
    })

    const text = await response.text()
    res.setHeader('Cache-Control', 'no-cache')
    res.status(response.status)
    try { res.json(JSON.parse(text)) } catch { res.send(text) }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
