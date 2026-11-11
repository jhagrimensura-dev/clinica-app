---
name: project-sessao-20261111
description: Sessão 2026-11-11 — Setup PC Windows + fixes InboxWhatsApp + obra-app Controle Mensal layout
metadata:
  type: project
---

## Manhã — Setup PC Windows

- Memória sincronizada: `~/.claude/projects/C--Users-User-clinica-app/memory` é uma junction para `repo/memory/` (mklink /J, não precisa admin).
- `scripts/setup-memory-sync.bat` corrigido: path era `-C-Users-...`, o certo é `C--Users-...` (`:` e `\` viram `-`); usa junction; detecta se já configurado.
- Git identity configurada no repo do PC: Joao Henrique.
- Vercel CLI 65.14.0 instalado no PC, logado e linkado ao projeto.
- Python não está instalado no PC (usar bash/node em scripts).
- Página Conexão: análise iniciada e pausada pelo usuário ("esquece isso por enquanto").
- Hook SessionStart: `git pull --ff-only` automático ao iniciar sessão para sincronizar memória entre Mac e Windows.

## Tarde — Fixes InboxWhatsApp (clinica-app)

**Fix 1 — Modal mostra lembretes existentes:** o modal RegistrarLead agora recebe `leadInicial` com o lead existente encontrado pelo telefone. Antes abria vazio e duplicava lembretes.

**Fix 2 — Detecção de lead existente:** comparação por `endsWith(tel.slice(-8))` (8 últimos dígitos) para lidar com prefixo `+55` do WhatsApp vs formato local.

**Fix 3 — Botão "Registrar" não aparece para lead já cadastrado:** mesma lógica de comparação por telefone na abertura da conversa.

**Fix 4/5/6 — Modal Lead Recorrente:** removidos campos Status, Origem e Mídia (não fazem sentido para pacientes recorrentes). Modal ficou mais largo (max-w-2xl) e com layout em grid.

**Fix API Key Anthropic:** chave `joao-api-key` venceu em 18/Out/2026. Nova chave criada e adicionada como `ANTHROPIC_API_KEY` nas env vars do Vercel. Campo de API key não existe nas Configurações (fica só no Vercel).

## Tarde — obra-app Controle Mensal layout

Problema: tabela não preenchia a tela inteira (espaço em branco à direita e embaixo).

Solução final (3 mudanças em `src/pages/Controle.jsx`):
1. Outer div: `flex flex-col` → permite o card crescer em altura
2. Card branco: `w-full flex-1` → ocupa toda largura e altura disponível
3. `<table>`: `w-full` → preenche o card, coluna "Pessoa · Cartão" absorve espaço extra à direita

**Why:** usuário queria a tabela preenchendo a tela como uma planilha, sem espaços cinza/branco vazios.
**How to apply:** para tabelas full-page no obra-app, usar `flex flex-col` no container, `w-full flex-1` no card, `w-full` na table.
