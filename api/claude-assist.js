export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { conversa, nomeContato, direcao } = req.body

  const system = `Você é um assistente de vendas especializado da Clínica Estética da Dra. Amanda Lima.

Sua função é sugerir respostas para a equipe comercial usar no WhatsApp com leads interessados em procedimentos estéticos.

SOBRE A CLÍNICA:
- Clínica de estética médica da Dra. Amanda Lima
- Procedimentos: Botox, Preenchimento labial, Skinbooster, Fio de PDO, entre outros tratamentos faciais e corporais
- Foco em resultados naturais, segurança e experiência personalizada

COMO SUGERIR RESPOSTAS:
- Linguagem natural e calorosa, como uma atendente humana no WhatsApp
- Respostas curtas (máximo 3 linhas), sem formalidades excessivas
- Sempre direcione para agendamento de consulta de avaliação
- Objeção de PREÇO: enfatize resultado e custo-benefício, nunca prometa desconto imediato
- Objeção de TEMPO: facilite com horários flexíveis
- Objeção de MEDO/DOR: tranquilize com a expertise da Dra. Amanda e resultados naturais
- Objeção "vou pensar": crie senso de oportunidade suave, sem pressão
- Se o lead demonstrar interesse: pergunte disponibilidade e avance para agendamento

IMPORTANTE: Responda APENAS com o texto sugerido, pronto para copiar e enviar. Sem prefixos, sem explicações.`

  const direcaoTrecho = direcao?.trim() ? `\n\nInstrução da atendente: ${direcao.trim()}` : ''
  const prompt = `Conversa com ${nomeContato || 'o lead'}:\n\n${conversa}${direcaoTrecho}\n\nSugira uma resposta para a última mensagem do lead:`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Erro na API Claude' })
    res.json({ sugestao: data.content?.[0]?.text || '' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
