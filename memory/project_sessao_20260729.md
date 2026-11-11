---
name: project-sessao-20260729
description: Sessão 2026-07-29 — fix definitivo dos sidinhos de lembrete (3 bugs empilhados)
metadata: 
  node_type: memory
  type: project
  originSessionId: 3fe3e48a-8a59-4d8e-9fe4-cfb7184af3e7
---

Fix dos sidinhos de lembrete no Inbox que desapareciam após refresh.

**Why:** 3 bugs empilhados mascarando um ao outro, acumulados desde o início do sistema.

**Bug 1 — IDs inválidos em 6 páginas:**
InboxWhatsApp (4 lugares), Indicacao, Resgates e AgendaLembretes usavam `Date.now()` como ID do lembrete. O Supabase aceitava silenciosamente (coluna TEXT), mas o dado ficava inacessível ou gerava duplicatas. Fix: `genUUID()` em todos os lugares.

**Bug 2 — RLS sem política SELECT:**
`agenda_lembretes` e `agendamentos` tinham RLS ativo mas nenhuma política SELECT. O SELECT do app retornava `[]` sem erro. O INSERT funcionava (outra política), e o realtime também (usa canal diferente). Fix: política `FOR ALL USING (clinica_id::text = auth.uid()::text OR clinica_id::text = (auth.jwt()->'user_metadata'->>'clinica_id'))`. O `::text` é obrigatório porque `clinica_id` pode ser TEXT enquanto `auth.uid()` é UUID.

**Bug 3 — Limite de 1000 rows do Supabase:**
A tabela acumulou 1000+ lembretes não-concluídos. Supabase tem max_rows=1000 por padrão (mesmo com `.limit(5000)` no client). O novo lembrete ficava além do corte. Fix: filtrar `dados->>'concluido' != 'true'` E `dados->>'data' >= 2 meses atrás` na query, reduzindo o resultado para abaixo de 1000.

**Como to apply:** Ao criar tabelas novas no Supabase, sempre adicionar política RLS com `::text` cast. Ao salvar IDs para Supabase, sempre usar UUID (genUUID()). Se uma tabela cresce sem limpeza, adicionar filtros de data na query de fetch.

---

## Fix Social Media — isFollow usando dataOrigem

**Problema:** Social Media mostrava 124 novos / 0 follow-up, enquanto Leads Novos mostrava 96 novos / 28 follow-up para o mesmo mês.

**Causa:** A função `isFollow` no Social Media só checava se `fonte`/`origemCustom` continha a palavra "follow" — não usava `dataOrigem`. Leads que chegaram em meses anteriores (com `dataOrigem = 2026-06-xx`) mas tinham `data = 2026-07-xx` eram contados como novos.

**Fix:** Alinhado `isFollow` no Social Media com a lógica do Leads Novos e Dashboard: primeiro checa se `dataOrigem || data` não pertence ao mês atual → follow-up; depois checa texto "follow".

**How to apply:** Sempre que houver lógica de "novos vs follow-up" em múltiplas páginas, usar a mesma função. A referência canônica é `isFollowUp` em `LeadsNovos.jsx` (checa `dataOrigem || data` vs `prefix`).
