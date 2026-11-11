---
name: project-sessao-20260717
description: "Sessão 2026-07-17 — Debug webhook WhatsApp @lid, polling de conversas, Z-API limitações"
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

Trabalho realizado em 2026-07-17 focado em mensagens enviadas do celular físico não aparecendo no inbox do WhatsApp.

**Problema raiz:** Z-API multi-device envia o webhook "ao enviar" com `phone: @lid` (ID interno do WhatsApp) em vez do número real do contato, e às vezes não dispara o webhook.

**Fixes implementados:**
- Webhook: 3 estratégias de resolução do phone @lid em cascata:
  1. chatName é número direto → usa direto
  2. Lookup por chatName no histórico de mensagens recebidas do Supabase
  3. Busca no chat list do Z-API pelo nome do contato (usa credenciais do `configuracoes` table)
- Fix: `valor` na tabela `configuracoes` é coluna `jsonb` (objeto), não string — removido `JSON.parse()` desnecessário que causava `hasToken: false` na instância Recorrente
- Fix: `tsRaw` do Z-API chat list vem em segundos → normalizado para ms antes de comparar com timestamps do Supabase
- Frontend: polling de 25s na conversa aberta (chama `fetchMensagens` silenciosamente)
- Frontend: parâmetro `silent=true` no `fetchMensagens` para não mostrar spinner no polling

**Limitações confirmadas do Z-API:**
- Webhook "ao enviar" não dispara consistentemente para mensagens enviadas do celular físico
- Quando dispara, `chatName` às vezes também vem como @lid (sem nome real) — impossível resolver
- Endpoint `/messages` do Z-API não inclui mensagens enviadas do celular (só API)
- Para contatos com `chatName = @lid`: nenhuma estratégia resolve

**Status:** Aguardando resposta do suporte da Z-API sobre incluir `chatId` real no payload do webhook "ao enviar". Se não resolverem, avaliar migração para **Evolution API** (open source, melhor suporte multi-device, requer servidor próprio — Railway.app ~R$25-50/mês).

**Why:** Dois iPhones (11 e 15 Pro Max) usam o mesmo número WhatsApp na instância "Leads Novos" via multi-device. iPhone 11 é o principal.
**How to apply:** Se o suporte da Z-API responder, verificar se incluem `chatId` no payload — se sim, fix simples no webhook. Se não, propor migração pro Evolution API.
