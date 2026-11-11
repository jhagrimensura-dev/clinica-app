---
name: project-sessao-20260702
description: "Sessão 2026-07-02 — ConfigContext, Agenda cores, Vendas, Dashboard, Social Media modal, reload controlado, Instagram Analytics"
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

Duas partes nesta sessão (antes e após compactação):

## Parte 1 (início da sessão — antes da compactação)

1. **ConfigContext** — fix clearInterval do versionInterval + reduzir de 120s → 30s
2. **Faturamento → Vendas** — renomeado título, card e cabeçalho da tabela
3. **Agenda** — cores padronizadas para brand (removidos tons azuis)
4. **Faturamento — valores por procedimento** — encoding `@{cents}` no campo procedimentos (ex: `"Botox@120000"`); `parseLinhaProc` extrai `storedVal`; `displayProc()` limpa para exibição; edição carrega valores salvos corretamente
5. **Receita por Procedimento** — corrigido: usava total do lançamento para cada proc; agora usa valor individual via `storedVal`
6. **Paciente Modelo** — novo tipo no lançamento; excluído do faturamento total; card próprio mostrando valor + ML gastos
7. **InboxWhatsApp** — erro "export def not valid JSON" corrigido: detecta resposta não-JSON e exibe mensagem orientando abrir draamandaliima.com.br
8. **Excluir lead** (LeadsNovos, LeadsRecorrentes, Indicacao) — botão ✕ sempre visível (opacity-20), confirmação com aviso "WhatsApp não é afetado", só admins
9. **Social Media badges** — `leadsDetalhadosPorDia` mapeando leads por dia; badge clicável abre modal com lista de leads + click no nome navega para inbox

## Parte 2 (continuação após compactação)

10. **Social Media modal** — commitado e deployado (feat: modal de leads ao clicar no badge)
11. **Agenda — fundo brand** — sidebar, grade, cabeçalhos e células com tons quentes; bordas `border-brand-200/40`
12. **Vendas — excluir lançamento** — botão ✕ na tabela, só admins; confirmação inline (Sim/Não)
13. **Social Media badges — excluir Follow Up** — leads "Instagram / Follow Up" não contam nos badges
14. **Reload controlado (ConfigContext)** — banner "Nova versão disponível"; force-reload via Supabase `app_force_reload`
15. **App.jsx — navegarInbox com telefone** — salva `sessionStorage('inbox_abrir_telefone')` antes de navegar
16. **Vendas — consultas fora do total** — `totalGeral = totalTratamentos`; grid-cols-3
17. **Dashboard — consultas fora do total** — `lMesSemConsulta` exclui consultas e Paciente Modelo

## Parte 3 — Instagram Analytics (sessão da noite)

18. **InboxWhatsApp — navegar para conta correta** — `contaTipo: 'Leads Novos'` no CustomEvent; App.jsx busca conta pelo `tipo` no localStorage `config_whatsapp_contas`

19. **AgendaLembretes** — várias melhorias:
    - 💬 button agora envia para a conta correta (Leads Novos/Recorrentes por `origem` do lead)
    - Lembretes de Aniversário em amarelo com 🎈 no final do campo
    - Legenda de cores no rodapé do calendário

20. **Faturamento** — "Vendas Total" → "Vendas Totais de Tratamentos"

21. **Relatórios** — área chart (recharts) comparando faturamento 2025 vs 2026 com dados reais; admin-only

22. **Instagram Analytics — migração para Supabase**:
    - `saveIGConfig`, `saveOrganico`, `saveCriativos`, `saveConfig` → agora fazem upsert no Supabase `configuracoes`
    - useEffects carregam do Supabase no mount; fallback p/ localStorage
    - Auto-migração: se Supabase vazio mas localStorage tem dados, sobe automaticamente
    - Admin-only: `podeVerItem` bloqueia `item.id === 'instagram'` para Funcionários

23. **Instagram Analytics — novas métricas**:
    - `CAMPOS_ORGANICO`: adicionados `total_seguidores`, `visitas_perfil`, `mensagens`
    - `fetchIGInsights` retorna: `total_seguidores` (da API do perfil, NÃO do Ads), `visitas_perfil` (profile_views), `mensagens` (text_message_clicks)
    - `sincronizar()` agora salva todos os 3 novos campos no merged
    - Painel Orgânico exibe: Distribuição (6 cards, grid-cols-3), Engajamento (5), Cliques & Conversão (5)

24. **Instagram Analytics — filtro de campanhas por tipo**:
    - `fetchData` agora faz 3 calls: insights overview + insights campanha + campanhas (com `objective`)
    - `objMap` junta campaign_id → objective
    - `LABEL_OBJETIVO` mapeia keys da API para pt-BR
    - `filtroTipo` state; botões "Todos / Leads / Tráfego / etc" no cabeçalho da tabela
    - Tabela ganha coluna "Tipo" com badge roxo

## Pendências para amanhã

- **Conectar Instagram orgânico**: usuário ainda não conectou a conta Instagram Business (token + userId). Precisa clicar em "Conectar Instagram" no Painel Orgânico → entrar com token do Meta Business Suite → após conectar, clicar "Sincronizar" para puxar dados automáticos.
- **Validar sincronização**: testar se os 3 novos campos (visitas_perfil, total_seguidores, mensagens) chegam corretamente da API após conexão.
- **Verificar filtro de campanhas**: testar se `objetivo` está chegando corretamente na API (pode precisar de permissão adicional no token do Ads).
- **Auto-migração localStorage→Supabase**: usuário precisa abrir a página no Mac onde tinha dados locais para disparar o upload automático.
