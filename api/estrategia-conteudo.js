export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { analises, especialidade, canais, frequencia, conselho } = req.body
  if (!analises?.trim()) return res.status(400).json({ error: 'Cole as análises das consultas.' })

  const numConsultas = (analises.match(/---/g) || []).length + 1

  const system = `Você é um estrategista de conteúdo para profissionais de saúde e estética, com experiência em marketing para serviços de ticket alto e respeito às normas éticas de publicidade da área.

Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois. Use exatamente esta estrutura:

{
  "mapa_objecoes": [
    {
      "tema": "Nome do tema",
      "subtemas": ["subtema 1", "subtema 2"],
      "frequencia": 3,
      "peso": "alto | médio | baixo",
      "descricao": "Como esse tema aparece nas falas dos pacientes"
    }
  ],
  "ranking": [
    { "posicao": 1, "tema": "Nome", "motivo": "Por que esse trava mais a decisão" }
  ],
  "calendario": [
    {
      "dia": 1,
      "tema_objecao": "Qual objeção esse conteúdo ataca",
      "formato": "Reels | Carrossel | Stories | Post estático | Vídeo longo",
      "gancho": "Primeira frase ou frame que prende a atenção",
      "roteiro": "Resumo do roteiro em 2-3 frases",
      "cta": "Call to action"
    }
  ],
  "whatsapp": [
    {
      "objecao": "Qual objeção essa mensagem responde",
      "tipo": "Texto | Áudio | PDF | Vídeo curto",
      "mensagem": "Texto ou roteiro completo da mensagem"
    }
  ],
  "faq": [
    {
      "pergunta": "Como o paciente pergunta",
      "resposta": "Resposta curta no tom de voz da profissional"
    }
  ],
  "lacunas": [
    "Objeção que só pode ser resolvida dentro da consulta (não com conteúdo)"
  ]
}`

  const prompt = `Você é um estrategista de conteúdo para profissionais de saúde e estética, com experiência em marketing para serviços de ticket alto e respeito às normas éticas de publicidade da área.

Analise as ${numConsultas} consultas abaixo e entregue a estratégia de conteúdo.

CONTEXTO
- Especialidade/serviço: ${especialidade || 'Harmonização facial e estética'}
- Canais: ${canais || 'Instagram e WhatsApp'}
- Frequência de postagem: ${frequencia || '4 posts por semana'}
- Conselho profissional: ${conselho || 'CFM/CFO'}

ANÁLISES DAS CONSULTAS
${analises.trim()}

REGRAS
- Baseie tudo nas falas reais dos pacientes; não invente objeções.
- Sem promessas de resultado, sem sensacionalismo, sem antes e depois que fira as normas do conselho profissional.
- Linguagem simples, como o paciente fala.
- Calendário deve ter exatamente 20 dias úteis (4 semanas × 5 dias).
- Conteúdos para WhatsApp: de 3 a 5 mensagens.
- FAQ: de 5 a 10 perguntas.

Retorne o JSON de estratégia:`

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
        max_tokens: 8000,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Erro na API' })

    const raw = data.content?.[0]?.text || ''
    let estrategia
    try {
      estrategia = JSON.parse(raw)
    } catch {
      return res.status(500).json({ error: 'Resposta da IA não foi JSON válido', raw })
    }

    res.json(estrategia)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
