export default async function handler(req, res) {
  const { i, t } = req.query
  if (!i || !t) return res.status(400).end()

  try {
    const response = await fetch(
      `https://api.z-api.io/instances/${i}/token/${t}/qr-code/image`,
      { headers: { 'client-token': t } }
    )
    if (!response.ok) return res.status(response.status).end()

    const buffer = await response.arrayBuffer()
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png')
    res.setHeader('Cache-Control', 'no-cache, no-store')
    res.end(Buffer.from(buffer))
  } catch {
    res.status(500).end()
  }
}
