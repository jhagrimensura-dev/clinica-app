---
name: project_sessao_20260930_1005
description: "Sessão 2026-09-30 a 10-05 — Fixes pós-Planilha: reload após sync, PlanilhaFollowUp→leads, agendados novos+indicação separados, agendRecorrentes por status, botão Sincronizar com mês/ano"
metadata: 
  node_type: memory
  type: project
  originSessionId: ee219fa4-2dea-4f0a-a7aa-cbc9a9fe6bc6
---

## Reload automático após sincronizar planilhas (09-30)

Após clicar em "Sincronizar Planilhas" no Dashboard, a página recarrega automaticamente para que os contextos React busquem os dados novos do Supabase.

**Why:** Contextos carregam na montagem; sem reload os dados antigos ficam em memória mesmo após o sync.

---

## PlanilhaFollowUp → sincroniza tabela leads ao salvar (10-01)

`PlanilhaFollowUp` agora sincroniza para a tabela `leads` tanto ao salvar uma célula quanto ao carregar a página.

**Why:** Dashboard e LeadsFollowUp liam da tabela `leads`; sem sync os agendamentos de follow-up não apareciam no Dashboard.

---

## Dashboard — agendados separados por Novos e Indicações (10-01)

Card "Leads Novos" no Dashboard exibe contagem separada:
- Leads Novos: X agend.
- Indicações: Y agend.

`totalAgendNovos` filtra `consultas tipo === 'Novo' || tipo === 'Indicação'` (não todas as consultas do mês).
`convComercial` usa só agendados de novos+indicação, não todas as consultas.

**Why:** Antes contava qualquer consulta do mês, inflava o número com recorrentes.

---

## agendRecorrentes usa status dos leads (10-02)

`agendRecorrentes` no Dashboard passou a usar `status === 'agendado'` da tabela `leads` em vez de contagem de vendas do Faturamento.

**Why:** Faturamento tem procedimentos feitos; leads recorrentes agendados são uma métrica de pipeline, não de receita.

---

## sync-planilha atualiza tabela leads para followup e recorrentes (10-02)

`api/sync-planilha.js` faz upsert também na tabela `leads` para registros de follow-up e recorrentes, não só novos.

---

## Botão Sincronizar — mês/ano selecionado e sem auth obrigatória (10-05)

Botão "Sincronizar Planilhas" no Dashboard passa o mês/ano do filtro selecionado para o endpoint `sync-planilha`.
Endpoint também aceita chamadas sem token de autenticação (para automação/cron).

**How to apply:** se o cron diário parar de funcionar, checar se o endpoint exige header `Authorization`.
