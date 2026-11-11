---
name: project-sessao-20260617
description: Sessão 2026-06-17 — correção de segurança crítica do Supabase (RLS + service key)
metadata: 
  node_type: memory
  type: project
  originSessionId: 32cbd0a4-dee5-4855-ac61-a1130d745b96
---

Sessão de 2026-06-17 focada em segurança.

**Why:** Supabase enviou alerta crítico — tabelas sem RLS estavam públicas.

## O que foi feito

### Segurança — RLS + Service Key
- `whatsapp_mensagens` e `configuracoes` com RLS ativado via SQL
- Policies criadas para `authenticated` ter acesso total
- Webhook (`api/webhook-whatsapp.js`) trocado de `VITE_SUPABASE_ANON_KEY` para `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_KEY` adicionada nas env vars do Vercel (Production + Preview)
- Service role key bypassa RLS no servidor; anon key do frontend fica restrita a usuários logados

**How to apply:** Se criar novas tabelas no Supabase, sempre ativar RLS e criar policy `authenticated` antes de usar em produção.
