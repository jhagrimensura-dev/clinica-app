---
name: project-sessao-20260821
description: "Sessão 2026-08-21 — Leads Follow Up nova página, Dashboard atualizado, fixes agendados/taxa/lembretes"
metadata: 
  node_type: memory
  type: project
  originSessionId: 678d0706-7577-4bd1-b807-d4911e61f33c
---

## O que foi feito

### Leads Follow Up (nova página)
- Criada página `src/pages/LeadsFollowUp.jsx` com CSV import adaptado para colunas: DATA ORIGEM, DATA FOLLOW UP, RESPONDEU, AGENDOU, VENDEU, PROCEDIMENTO, VALOR, Observação
- Statuses: `em_aberto`, `respondeu`, `agendado`, `vendido`, `perdido`; `origem: 'leads_followup'`
- `data` = DATA FOLLOW UP (para filtro mensal funcionar); `dataOrigem` = '' (vazio)
- Mesma detecção de suspeitos por primeiro nome que Leads Novos
- Adicionada no `App.jsx`, `Sidebar.jsx` e `PAGE_PARENT`
- Cards de status (5 cards) foram **removidos** a pedido do usuário; ficou só barra de resumo (total + taxa)

### Dashboard
- Card "Leads Follow" agora usa `getLeadsPorOrigem('leads_followup', ano, mes)` em vez dos antigos leads_novos com follow1/2/3
- Exibe: total em acompanhamento, em aberto · respondeu, agendado · vendido, % conversão

### Faturamento — excluir lançamento reverte status do lead
- `handleExcluir` no Faturamento.jsx: ao excluir um lançamento, busca lead pelo nome do paciente com `status === 'agendado'`; se não há outros lançamentos para o mesmo nome, reverte para `em_aberto`
- Resolve caso: usuário apaga lançamento mas lead ficava travado em 'agendado' no Dashboard

### Leads Novos
- Removida seção "Leads em Follow-up" (lista de 143 leads com Follow #1/2/3) — substituída pela nova página dedicada
- Total de Leads no card usa `leads.length` (66) e não mais `leads.length + contIndicacao` (75)
- Taxa de Conversão usa `leads.length` como denominador (não mais incluía indicações)

### Fix lembretes concluídos sumindo após refresh
- `AgendaContext.jsx` linha 41: `lemValidos` filtrava `!r.dados.concluido`, removendo do estado após reload
- Fix: remover esse filtro para carregar todos os lembretes do banco independente de `concluido`
- `AgendaLembretes.jsx`: lista "Próximos Lembretes" também filtrava `!l.concluido`; agora exibe todos com opacidade reduzida + nome riscado + "✓" na data

**Why:** usuário marcava lembrete como feito, ele sumia ao recarregar — dado estava sendo descartado na carga do Supabase.

**How to apply:** nunca filtrar lembretes concluídos na carga do banco; filtrar só na UI quando necessário, mantendo dado intacto no estado.
