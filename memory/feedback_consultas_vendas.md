---
name: feedback-consultas-vendas
description: Consultas NUNCA entram na contagem de Vendas — só o valor entra no faturamento total
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

Consultas são atendimentos clínicos, não vendas de procedimentos. A regra é:

- **Contagem de Vendas** (card "Vendas", funil de conversão, ticket médio, countNovos/Recorrentes): usar `lMesSemConsulta` — NUNCA incluir consultas
- **Valor do Faturamento Total**: incluir `valorTaxa` das consultas — elas geram receita mas não são "vendas"
- A linha "Consultas" no breakdown do card mostra o valor separado, como informação adicional

**Why:** Consultas inflam a contagem de vendas de procedimentos e distorcem o ticket médio. O usuário reclamou desta confusão múltiplas vezes.

**How to apply:** Sempre que mexer em Dashboard.jsx ou Faturamento.jsx, verificar que `lMesSemConsulta` (filtra `!isConsulta(l) && l.tipo !== 'Paciente Modelo'`) é usado para COUNTS e TICKET, enquanto `lMesValidos` (filtra só `l.tipo !== 'Paciente Modelo'`) é usado para o VALOR TOTAL.
