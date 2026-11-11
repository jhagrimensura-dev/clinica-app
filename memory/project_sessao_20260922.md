---
name: project_sessao_20260922
description: Sessão 2026-09-22 — MCP server MVP confirmado + import automático Google Sheets + cron diário
metadata: 
  node_type: memory
  type: project
  originSessionId: 655248e7-c125-44f1-a944-acbaad080b18
---

## O que foi feito

### MCP Server (9 ferramentas confirmadas funcionando)
- Tools: resumo_mes, leads_pipeline, leads_sem_followup, faturamento_detalhado, agenda_proximos_dias, leads_por_origem, buscar_lead, analises_conversas, performance_geral
- Fix colunas: `valor_tratamento`, campos date/time
- Service key configurada em `.mcp.json`

### Tool 10: importar_planilha (MCP)
- Lê CSV das 3 abas do Google Sheets publicado e importa no Supabase
- Parâmetros: `tab` (novos/followup/recorrentes/todos), `ano`, `mes`
- Apaga e reimporta só o mês alvo — nunca toca em outros meses ou faturamento
- Google Sheets publicado via "Publicar na web" → CSV

**URLs das abas (PUBLISHED_ID: `2PACX-1vSQHBxm7a-u_r5dMNrZtYoMHRs3awELyB968s8aqj0HcJSeP1PjnE3n_FWZ8bB54BeFNVc3Syv0E5Fr`)**
- Leads Novos: GID `574898400` → tabela `planilha_leads`
- Follow Up: GID `1573659618` → tabela `planilha_followup`
- Recorrentes: GID `876639945` → tabela `planilha_recorrentes`

### Cron diário: /api/sync-planilha
- Roda todo dia às 3h UTC (meia-noite de Brasília)
- Configurado em `vercel.json` como cron `0 3 * * *`
- Importa as 3 abas automaticamente para o mês atual
- CLINICA_ID adicionado como env var no Vercel

### Bug crítico descoberto: trigger no banco cria leads automaticamente
- Quando um registro é inserido em `planilha_leads`, um trigger do Supabase cria automaticamente um registro em `leads` com o mesmo UUID
- Isso causava duplicatas: antigos leads (UUIDs diferentes) + novos (via trigger)
- Fix: `sync-planilha.js` agora deleta os leads com IDs da planilha ANTES de apagar a planilha, evitando órfãos

### Import de setembro feito manualmente
- Leads Novos: 73 linhas
- Follow Up: 91 linhas
- Recorrentes: 156 linhas
- 72 leads órfãos removidos da tabela `leads`

### Cron atualizado (2026-09-23)
- Alterado para 3x ao dia: 09h, 13h e 17h BRT (12h, 16h e 20h UTC)
- Confirmado que rodou na madrugada de 23/09 às 03:36 UTC

**Why:** Substituir o processo manual de colar CSV no app por import automático diário direto do Google Sheets.

**How to apply:** Ao importar planilha_leads programaticamente, sempre deletar os leads vinculados (por ID) ANTES de deletar a planilha, para evitar duplicatas via trigger.
