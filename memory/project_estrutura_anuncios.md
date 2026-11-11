---
name: project-estrutura-anuncios
description: Estrutura dos anúncios da clínica — Instagram Impulsionar vs Tráfego no Gerenciador
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

## Tipos de anúncio

### Instagram = Impulsionar
- Impulsionamento direto pelo Instagram (não pelo Gerenciador de Anúncios)
- Os leads que chegam por aqui vêm via **Link da bio** ou **Link dos stories**
- Aparecem no inbox com o nome do anúncio referenciando "bio" ou "stories"

### Tráfego = Campanha no Gerenciador
- Campanha que roda no Meta Ads Manager (Gerenciador de Anúncios)
- Tipo: campanha de mensagens (Click-to-WhatsApp)
- Contém múltiplos anúncios
- **Padrão de nome dos anúncios**: sempre têm emoji + coração ❤️ ou bolinha 🔵 no nome
- Exemplo de nome: "❤️ Botox Dra Amanda 🔵"

## Como isso afeta o sistema

Quando um lead chega pelo WhatsApp via anúncio, o badge roxo no Inbox mostra o nome do anúncio.
- Se o nome tiver emoji/coração/bolinha → veio do Gerenciador (campanha Tráfego)
- Se mencionar "bio" ou "stories" → veio do Impulsionar do Instagram

**Why:** Útil para identificar a origem do lead no inbox e futuramente filtrar leads por tipo de campanha.
**How to apply:** Ao implementar filtros de origem de anúncio ou relatórios de leads, usar esse padrão de nomenclatura para classificar automaticamente.
