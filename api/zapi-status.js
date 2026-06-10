export default async function handler(req, res) {
  const { i, t, ct } = req.query
  if (!i || !t) return res.status(400).json({ error: 'Missing params' })

  res.setHeader('Cache-Control', 'no-cache, no-store')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const response = await fetch(
      `https://api.z-api.io/instances/${i}/token/${t}/status`,
      { headers: { 'Content-Type': 'application/json', ...(ct ? { 'client-token': ct } : {}) } }
    )
    const text = await response.text()
    let data
    try { data = JSON.parse(text) } catch { return res.status(500).json({ error: 'Invalid JSON', raw: text.slice(0, 200) }) }
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
