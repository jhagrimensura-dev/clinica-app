---
name: feedback_planilha_trigger
description: Trigger no banco cria leads automaticamente ao inserir em planilha_leads — apagar leads vinculados ANTES de deletar a planilha
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 655248e7-c125-44f1-a944-acbaad080b18
---

Ao deletar e reimportar registros em `planilha_leads`, sempre apagar primeiro os registros correspondentes em `leads` (usando os IDs da planilha), antes de fazer o DELETE na planilha.

**Why:** Existe um trigger no Supabase que cria automaticamente um registro em `leads` com o mesmo UUID quando um registro é inserido em `planilha_leads`. Se você apagar a planilha e reimportar com novos UUIDs, os antigos leads ficam órfãos e causam duplicatas detectadas pelo sistema.

**How to apply:** Em qualquer script ou endpoint que reimporte `planilha_leads`:
1. Busca os IDs atuais da planilha do mês
2. Deleta os leads com esses IDs da tabela `leads`
3. Deleta a planilha do mês
4. Insere novos registros na planilha (trigger cria os novos leads automaticamente)
