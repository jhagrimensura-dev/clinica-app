---
name: project-sessao-20260625
description: "Sessão 2026-06-25 — Análises Instagram, rastreamento de leads, fixes de inbox"
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

Análises Instagram + rastreamento de origem de leads + fixes no inbox.

**Why:** usuário quer entender desempenho do Instagram e rastrear de onde vêm os leads.

**How to apply:** contexto para continuar o trabalho de analytics de marketing.

## O que foi feito

- Nova página **Análises Instagram** (`src/pages/InstagramAnalytics.jsx`) no menu lateral
  - Conecta com Meta Ads API via token (configurar integração)
  - Mostra gasto, impressões, alcance, cliques, CTR, CPM por período (7/30/90 dias)
  - Painel "Leads por Origem" sempre visível (independente do token)

- **Rastreamento de origem dos leads** — opções atualizadas:
  - `Instagram Anúncio` e `Instagram Orgânico` (em vez de só "Instagram")
  - Atualizado em InboxWhatsApp (`ORIGENS_PADRAO`) e LeadsNovos

- **Token Meta Ads API** — pendente. Usuário não conseguiu acessar developers.facebook.com (conta restrita pela Meta). Gestor de tráfego vai gerar o token. Quando chegar, colar em Análises Instagram → Configurar integração. Token salvo em `localStorage.instagram_ads_config`.

- **Indicador de sino no inbox** — 🔔 + número aparece na lista de conversas quando lead tem lembretes ativos

- **Lembretes existentes no modal de edição** — ao editar lead, mostra lembretes da agenda (fundo amarelo) com botão de apagar

- **Bug arquivar corrigido** — conversas arquivadas voltavam após 10s (refresh da Z-API); agora persiste em `localStorage[inbox_arquivadas_{contaId}]`

- **Botão de voltar do browser** — corrigido com `pushState`/`popstate`; URL fica `#/pagina`

- **Node.js atualizado para 24.x** no package.json (era 20.x, deprecado em out/2026)
