---
name: sessao-20260728
description: "Sessão 2026-07-28 — card Leads Novos (novos/follow-up), Agendamentos via Faturamento, consultas clicáveis, bug fix revertRef"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3fe3e48a-8a59-4d8e-9fe4-cfb7184af3e7
---

## O que foi feito

### Card "Total de Leads" em LeadsNovos
- Substituído breakdown por status por três linhas: **Novos este mês** (azul), **Em follow-up** (âmbar)
- `leadsNovosCount` = leads onde `dataOrigem || data` começa com prefix atual
- `leadsEmFollowCount` = leads onde `dataOrigem || data` NÃO começa com prefix
- Indicações removidas do card (aparecem na aba própria, não na lista)

### Card "Agendamentos" em LeadsNovos
- Não usa mais `funil.agendado + funil.fechado`
- Agora mostra `consultasMes.length` = lancamentos com `procedimentos === 'consulta'` do mês atual
- Lista os nomes das pacientes abaixo do número
- Importa `useVendas` em LeadsNovos para acessar lancamentos

### Card "Consultas (R$)" em Faturamento
- Clicável — expande para mostrar nomes das pacientes
- State `consultasAberto` no componente Faturamento
- Sem seta (removida a pedido do usuário)

### Bugs introduzidos e corrigidos
- **Sync destrutivo**: várias tentativas de sync automático lead↔lancamento falharam e alteraram status de leads indevidamente (10 leads ficaram como "fechado" em vez de ~7)
- **revertRef crítico**: código adicionado para reverter leads "fechado" rodava toda sessão, destruindo dados do usuário — REMOVIDO no commit 6e52725
- Os leads que ficaram com status errado foram revertidos via o revertRef na sessão (rodou uma vez antes de ser removido)

### Limpeza de código
- `handleAddLancamento` wrapper inútil removido do Faturamento
- `updateLead` removido do Faturamento (não é mais necessário)
- `useRef`, `todosLeads` removidos do LeadsNovos

## Estado atual dos leads (julho/2026)
- 97 total na lista Leads Novos
- 68 novos este mês, 29 em follow-up
- 7 consultas pagas (confirmado pelo usuário)

## Commits da sessão
- `8c2524c` — card Total de Leads + consultas clicáveis no Faturamento
- `26bf709` — remover seta do card Consultas
- `b5d8d55` — Agendamentos mostra consultas pagas do Faturamento, reverte leads fechado indevido
- `6e52725` — fix: remover revertRef destrutivo e limpar código morto

**Why:** Consistência entre Faturamento e Leads Novos; evitar side effects de sync automático
**How to apply:** Para futuras integrações entre contextos, preferir leitura cruzada de dados (import useVendas em LeadsNovos) em vez de alterar status via sync automático
