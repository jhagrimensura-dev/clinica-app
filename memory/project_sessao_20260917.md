---
name: project_sessao_20260917
description: "Sessão 2026-09-17 — PlanilhaFollowUp sync→LeadsFollowUp, PlanilhaRecorrentes nova página, fix status keys, CAC só tipo Novo"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4f987a3b-f983-45d8-a61c-2c9176ba9bde
---

## O que foi feito

### PlanilhaFollowUp → LeadsFollowUp (sync)
- Implementado o mesmo padrão de sincronização que PlanilhaLeads → LeadsNovos
- Import modal: deleta leads do mês com `origem='leads_followup'` na tabela `leads`, depois upsert com mesmo UUID
- `toggleBool` chama `syncRowData` ao alterar respondeu/agendou/vendeu
- `data_origem: ''` nos payloads de sync (crítico: `getLeadsPorOrigem` filtra por `l.dataOrigem || l.data` — se data_origem tiver data de julho/agosto, o filtro de setembro falha)
- Fix `parseSheetDate` com validação de rollover (ex: 31/09 → null; 24/08/0202 → excluído pelo filtro de mês)

### Status keys padronizados
- LeadsFollowUp usava `'respondeu'`/`'vendido'` (strings antigas); migrado para `'conversando'`/`'fechado'`
- `LeadsContext.normalizeStatusKey` faz migração automática: `'respondeu'→'conversando'`, `'vendido'→'fechado'`
- `rowStatus()` em PlanilhaFollowUp: `vendeu→'fechado'`, `agendou→'agendado'`, `respondeu→'conversando'`, default `'em_aberto'`

### PlanilhaRecorrentes (nova página)
- Arquivo: `src/pages/PlanilhaRecorrentes.jsx`
- Colunas: `data, nome, telefone, agendou, vendeu, valor, observacao`
- Parser especial: "AGENDOU PRÓXIMO MÊS" na coluna VENDEU → `vendeu=false`, texto vai para observacao
- Sync para `leads` com `origem: 'leads_recorrentes'`
- Tabela Supabase criada pelo usuário (`planilha_recorrentes` com RLS)
- Adicionada no menu Sidebar (grupo planilhas) e roteada em App.jsx

### Dashboard — fix CAC
- CAC agora conta apenas `tipo === 'Novo'` em `lConsultas`
- Exclui: Indicação (custo zero, veio por boca a boca), Novo Follow (já estava no funil), Recorrência (cliente já adquirido)
- `const cacClientes = lConsultas.filter(l => l.tipo === 'Novo').length`

### Dashboard — fix Follow Up status
- `fuRespondeu`/`fuVendido` usavam keys antigas; corrigido para `'conversando'`/`'fechado'`

**Why:** Planilhas de follow-up e recorrentes precisavam ter os mesmos dados que aparecem nas páginas de leads, evitando divergência entre a planilha operacional e os cards do dashboard.

**How to apply:** Ao criar novas planilhas de leads, sempre seguir o padrão: upsert com mesmo UUID + `data_origem: ''` + deletar mês antes de importar. Status sempre usar VALID_STATUSES do LeadsContext.
