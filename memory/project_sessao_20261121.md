---
name: project-sessao-20261121
description: "Sessão 2026-11-21 — início integração Meta Ads API (diagnóstico do gestor de tráfego), voz em pt, extensão Chrome instalada"
metadata:
  node_type: memory
  type: project
  originSessionId: 314b7e0f-a301-46e0-980f-45c29f0efdce
  modified: 2026-11-21T12:55:45.457Z
---

**Contexto:** usuário gasta ~R$15k/mês no Gerenciador de Anúncios via gestor de tráfego terceirizado e acha que chegam poucos leads. Quer aprender e assumir o tráfego (campanhas próprias). Escolheu integrar via **API da Meta** (vai usar muito).

**Estado atual:**
- InstagramAnalytics.jsx já tem tela Meta Ads (insights por campanha/anúncio) lendo `configuracoes.instagram_ads_config` ({token, accounts:[{id,label}]}) — mas NÃO há config salva no Supabase (nunca conectada).
- Próximo: passo a passo para gerar token permanente (System User) no Business Manager: 1) confirmar usuário é admin e conta de anúncios pertence ao Business da clínica (não ao gestor) 2) criar app tipo Empresa + API de Marketing 3) usuário do sistema "clinica-app" Admin com ativos 4) token sem expiração com ads_read, ads_management, business_management, pages_read_engagement, instagram_basic, instagram_manage_insights 5) salvar token + act_ID.
- Parou no passo 1. Extensão Claude in Chrome instalada via /chrome; precisa reiniciar o Claude Code para as ferramentas carregarem. Usuário quer que eu navegue pelo Chrome dele.
- Depois do token: diagnóstico (custo por lead, gasto x leads reais da planilha_leads por criativo), depois ensinar estrutura de campanha.

**Outros:** voz ativada (/voice, segurar espaço), `language: "portuguese"` no ~/.claude/settings.json (com "portugues" o ditado caía em inglês). Usuário quer TUDO em português, inclusive perguntas.
**Pendente (usuário pediu para deixar):** senhas do xau-journal em texto aberto em memory/project_sessao_20261116.md.
