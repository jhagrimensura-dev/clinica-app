export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { texto } = req.body
  if (!texto?.trim()) return res.status(400).json({ error: 'Texto é obrigatório' })

  const system = `Você é um especialista em vendas de clínica estética. Analise o conteúdo abaixo — pode ser uma transcrição de conversa, notas de consulta, resumo de atendimento ou anotações rápidas — e extraia insights comerciais.

Interprete o conteúdo da melhor forma possível, mesmo que esteja com palavras coladas, abreviações ou formato informal de anotação.

Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois. Use exatamente esta estrutura:

{
  "resumo": "Resumo executivo em 2-3 frases do que foi conversado/anotado e o resultado",
  "perfil_lead": "Descrição breve do perfil do lead (interesse, momento de compra, situação geral)",
  "objecoes": [
    {
      "objecao": "Descrição da objeção ou dificuldade identificada",
      "tipo": "preco | tempo | medo | duvida | comparacao | outro",
      "trecho": "Trecho ou dado do conteúdo onde isso aparece (pode ser inferido das notas)",
      "como_responder": "Como a equipe deve abordar isso na próxima vez"
    }
  ],
  "proximos_passos": [
    "Ação 1 recomendada",
    "Ação 2 recomendada"
  ],
  "temperatura": "frio | morno | quente",
  "temperatura_motivo": "Por que essa temperatura com base no conteúdo"
}`

  const prompt = `Analise o conteúdo abaixo e retorne o JSON:\n\n${texto.trim()}`

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

    // Tenta extrair JSON mesmo que venha com texto ao redor
    let analise
    try {
      analise = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try { analise = JSON.parse(match[0]) } catch {}
      }
      if (!analise) return res.status(500).json({ error: 'Não foi possível interpretar o conteúdo. Tente com mais detalhes sobre a conversa.', raw })
    }

    res.json(analise)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
