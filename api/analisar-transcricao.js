export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { texto } = req.body
  if (!texto?.trim()) return res.status(400).json({ error: 'Texto da transcrição é obrigatório' })

  const system = `Você é um especialista em vendas de clínica estética. Analise transcrições de conversas com pacientes/leads e extraia insights comerciais.

Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois. Use exatamente esta estrutura:

{
  "resumo": "Resumo executivo em 2-3 frases do que foi conversado e o resultado",
  "perfil_lead": "Descrição breve do perfil do lead (interesse, momento de compra, objeções gerais)",
  "objecoes": [
    {
      "objecao": "Descrição da objeção levantada",
      "tipo": "preco | tempo | medo | duvida | comparacao | outro",
      "trecho": "Trecho exato da conversa onde aparece",
      "como_responder": "Como a equipe deve responder essa objeção da próxima vez"
    }
  ],
  "proximos_passos": [
    "Ação 1 recomendada",
    "Ação 2 recomendada"
  ],
  "temperatura": "frio | morno | quente",
  "temperatura_motivo": "Por que essa temperatura"
}`

  const prompt = `Analise a transcrição abaixo e retorne o JSON de análise:\n\n${texto.trim()}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Erro na API Claude' })

    const raw = data.content?.[0]?.text || ''
    let analise
    try {
      analise = JSON.parse(raw)
    } catch {
      return res.status(500).json({ error: 'Resposta da IA não foi JSON válido', raw })
    }

    res.json(analise)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
