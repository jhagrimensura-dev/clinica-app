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
- 2ª conversa (mesmo dia): usuário rodou /chrome e aceitou permissões, mas as ferramentas `mcp__claude-in-chrome__*` ainda NÃO aparecem no ToolSearch. Próximo passo: reiniciar o Claude Code e testar de novo; se falhar, pedir print da tela do /chrome.
- 3ª conversa: Chrome FUNCIONANDO (abriu draamandaliima.com.br, Dashboard carregou logado). Próximo: retomar passo 1 do token Meta navegando no Business Manager.
- PASSO 1 OK: João (jhagrimensura) tem Acesso total no Business "Amanda Lima Silva" (business_id 1866413210037163, verificado). 3 contas de anúncios, todas propriedade da clínica: CA - AMANDA LIMA 03 (1446093280693129), Dra Amanda 02 (407454144724912), Amanda Lima - Rio Verde (2586845538290274). Alerta: ~10+ pessoas com Acesso total (gestores/terceiros) — revisar depois. Próximo: passo 2 (criar app Empresa + API de Marketing).
- MUDANÇA DE PLANO (discrição: João não quer que o gestor saiba): em vez de System User no Business, usar token de usuário do João via app próprio "Clinica Amanda" ID 1750785026075803 (Tipo Empresa, SEM Business, API de Marketing já adicionada). Token longo gerado em 2026-11-21 via Graph Explorer + Depurador "Estender" — expira 2027-01-20 (renovar antes). Escopos: ads_read, ads_management, instagram_*, pages_*. Lê 5 contas (3 da clínica + 2 pessoais do João: Joao Henrique Ferreira, New Tech Locações). Próximo: João cola token em Instagram Analytics → Conectar Instagram Ads (eu não colo tokens).
- META ADS CONECTADO no sistema (Instagram Analytics → seção Meta Ads, 3 contas). Conta Dra Amanda 02: R$13.035 gasto, 24 campanhas, 113 conversas WA + 7 leads form. 1ª leitura: VENDAS WHATSAPP R$1.533→61 conversas (~R$25), ENGAJAMENTO MSG WA R$1.397→41 (~R$34), campanhas TRÁFEGO/VISITA+cliques ~R$10k→~10 conversas (levam ao perfil, medir via leads Instagram Bio). Frequência alta: Remarketing 7.5x, Vendas 6.3x, Engaj 5.7x. Lembrete Google Agenda 15/01/2027 criado. Próximo: diagnóstico cruzando gasto x leads da planilha_leads.
- FIX: upserts em configuracoes no InstagramAnalytics sem .then() nunca eram enviados (supabase-js lazy) — corrigido commit 0e1dbd4, token agora no banco.
- DIAGNÓSTICO out/26 (conta Dra Amanda 02; CA 03 dá erro #200 sem permissão p/ token do João; Rio Verde R$0): gasto R$13.638; Engaj MSG WA R$2.467→94 conv, Vendas WA R$693→39 conv, LINK_CLICKS ~R$10.5k→~17 conv. Remarketing freq 20x. Planilha out: Tráfego 58 leads→4 agend→1 venda R$4.6k; Instagram Bio 25→4 vendas R$27.4k. Nov até 21: gasto R$8.557, Tráfego 28→2 agend→0 vendas; Bio 33→4 vendas R$14k. ~150 conversas Meta vs 58 leads registrados.
- Usuário pediu reorganizar aba Análises Instagram (tirar o que está em branco) — proposta enviada, aguardando OK.
- Hook SessionStart/End trocado para `scripts/memoria-sync.mjs start|end` (substitui session-pull/push).
- Depois do token: diagnóstico (custo por lead, gasto x leads reais da planilha_leads por criativo), depois ensinar estrutura de campanha.

**Outros:** voz ativada (/voice, segurar espaço), `language: "portuguese"` no ~/.claude/settings.json (com "portugues" o ditado caía em inglês). Usuário quer TUDO em português, inclusive perguntas.
**Pendente (usuário pediu para deixar):** senhas do xau-journal em texto aberto em memory/project_sessao_20261116.md.
