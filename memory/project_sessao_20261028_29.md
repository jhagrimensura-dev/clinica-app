---
name: project_sessao_20261028_29
description: "Sessão 2026-10-28 a 10-29 — Planilha Recorrentes (abas mensais, auto-mover, dropdown), fix Metas sem Paciente Modelo, MCP gerente melhorado, hook SessionStart briefing automático"
metadata: 
  node_type: memory
  type: project
  originSessionId: ee219fa4-2dea-4f0a-a7aa-cbc9a9fe6bc6
---

## Planilha Recorrentes — abas mensais (10-28)

`LeadsRecorrentes` (Planilha Recorrentes) ganhou abas mensais separadas por mês.
- Header fixo ao rolar a tabela
- Auto-mover paciente para o próximo mês quando agendado
- Dropdown "Agendou" com 5 opções (não só sim/não)

---

## Fix agendamentos de follow-up no Dashboard (10-28)

Contagem de agendamentos de follow-up no Dashboard passou a ler diretamente de `planilha_followup` em vez da tabela `leads`.

**Why:** tabela `leads` tinha registros desatualizados por falha na sync; `planilha_followup` é a fonte de verdade.

---

## Fix Metas — exclui Paciente Modelo (10-29)

Calendário de Metas excluiu "Paciente Modelo" dos totais diários.

**Why:** Paciente Modelo era um registro de teste que inflava as métricas de metas todos os dias.

**How to apply:** ao depurar totais estranhos em Metas, verificar se há pacientes de teste no banco.

---

## MCP gerente — melhorias (10-29)

MCP do gerente recebeu melhorias. Correções no Dashboard:
- Recorrentes agora lê da `planilha_recorrentes` (não mais da tabela `leads`)
- Agendamentos de follow-up lidos de `planilha_followup`
- Metas excluem Paciente Modelo

---

## Remove sync da aba Recorrentes do Google Sheets (10-29)

Sincronização automática da aba Recorrentes com o Google Sheets foi removida.

**Why:** Recorrentes agora tem lógica própria de abas mensais no app — sync com Sheets causava conflitos.

---

## Hook SessionStart — briefing automático (10-29)

Hook de `SessionStart` configurado no Claude Code: ao iniciar qualquer sessão, busca automaticamente dados do dia via MCP e exibe briefing no topo da sessão.

**Conteúdo do briefing:**
- Agendamentos do dia
- Follow-ups para ligar hoje
- Faturamento (ontem + mês atual)
- Leads do mês (novos + recorrentes)
- Alertas do sistema

**How to apply:** o briefing aparece automaticamente — não precisa pedir "me dê um resumo do dia".
