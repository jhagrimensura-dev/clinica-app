---
name: project-sessao-20260709
description: Sessão 2026-07-09 — Painel Orgânico Instagram conectado + feriados + sort Faturamento + fixes API Graph
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

## Faturamento
- Ordenação crescente/decrescente por data na tabela de Lançamentos de Vendas

## Pós Tratamento
- Removido campo "Status do contato" do modal de edição

## Feriados nacionais
- Criado `src/lib/feriados.js` com cálculo de Páscoa e cache por ano
- Criado `src/components/FeriadoAviso.jsx` (reutilizável)
- Adicionado em: Agenda, AgendaLembretes, Metas (grid), LeadsNovos, LeadsRecorrentes, Indicacao

## Painel Orgânico Instagram — conexão real
- Conta conectada: @dra.amandaliima (ID 17841407062223101), Page ID 1843228765995786
- Token gerado via Graph API Explorer (curta duração, expira em ~1h; precisa renovar)
- `fetchIGAccounts` com 3 estratégias: /me/accounts → /me/assigned_pages → /me/businesses
- Quando tudo falha: campo de conexão manual com ID pré-preenchido
- Métricas corrigidas para API Graph v20+:
  - Call 1 (period=day, until30): reach, follower_count
  - Call 2 (metric_type=total_value, period=day, until30): views, profile_views, accounts_engaged, website_clicks, total_interactions, likes, comments, shares, saves
  - Limite de 30 dias por chamada (until30 = min(until, since+2592000))
  - Post insights: reach, views, saved, shares (não saves)

## Criativos
- Thumbnail do post (media_url/thumbnail_url, children para carrossel)
- Data de publicação (publicado_em) exibida abaixo do nome
- Importar posts atualiza thumbnail+data dos existentes (não só adiciona novos)
- URLs do CDN do Instagram expiram ~24h → reimportar para atualizar imagens
- Fallback gracioso (🖼) quando URL expirada

## Tooltips na tabela de Criativos
- Componente InfoBubble com position:fixed (escapa overflow)
- Inverte para esquerda quando perto da borda direita
- Textos curtos e diretos para cada coluna

## Layout
- Removido max-w-5xl do Instagram Analytics para preencher tela inteira

**Why:** Sessão focada em conectar o Instagram Orgânico ao Painel e corrigir erros da API Graph v20+.
**How to apply:** Token precisa ser renovado periodicamente no Graph API Explorer. Reimportar posts sempre que precisar ver thumbnails atualizadas.
