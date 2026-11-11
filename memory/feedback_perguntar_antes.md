---
name: feedback-perguntar-antes
description: Perguntar ao utilizador antes de implementar quando localização ou formato não forem explícitos
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f7a786eb-4561-4e4c-b48c-4eb25ce9939d
---

Quando o pedido menciona "mostrar X em Y" mas Y pode ser interpretado de mais de uma forma (lista vs modal, inline vs separado, readonly vs editável), perguntar antes de implementar.

**Why:** Implementei o telefone na lista de Leads Novos quando o utilizador queria no modal — tive de reverter e refazer. O utilizador disse explicitamente "vocês têm que me perguntar se quero algo antes de fazer".

**How to apply:** Se a localização, o formato ou o comportamento de uma feature não estiver 100% claro, fazer 1-2 perguntas rápidas antes de escrever qualquer código. Não assumir.
