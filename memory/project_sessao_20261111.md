---
name: project-sessao-20261111
description: Sessão 2026-11-11/12 — Windows setup + InboxWhatsApp fixes + obra-app Controle Mensal layout
metadata:
  type: project
---

## Manhã 11/11 — Setup PC Windows

- Memória sincronizada: `~/.claude/projects/C--Users-User-clinica-app/memory` é uma junction para `repo/memory/`.
- `scripts/setup-memory-sync.bat` corrigido: path `C--Users-...` (`:` e `\` viram `-`); usa junction; detecta se já configurado.
- Hook SessionStart: `git pull --ff-only` automático ao iniciar sessão.
- Vercel CLI 65.14.0 instalado no PC.
- Git identity configurada no repo obra-app.

## Fixes InboxWhatsApp (clinica-app)

- Modal RegistrarLead agora recebe `leadInicial` com lead existente encontrado por telefone (evita duplicar lembretes).
- Comparação de telefone por `endsWith(tel.slice(-8))` para lidar com prefixo `+55`.
- Modal Lead Recorrente: removidos campos Status, Origem e Mídia. Modal mais largo (max-w-2xl, grid layout).
- API Key Anthropic atualizada no Vercel (`ANTHROPIC_API_KEY`). Chave `joao-api-key` venceu 18/Out/2026.

## obra-app Controle Mensal — layout final (Mac + Windows)

Solução final após várias iterações:
- Outer div: `flex flex-col` + `min-h-screen`
- Card branco: `w-full flex-1`
- `<table>`: `w-full`
- Colunas de mês (`<th>`): `min-w-[100px]` → garante largura mínima legível
- Quando poucos meses (2026, 2028): tabela preenche o card (`w-full`) ✓
- Quando muitos meses (2027, 12 colunas × 100px > tela): tabela scrolla horizontalmente ✓
- `scrollbar-hide` removido → scrollbar visível para o usuário saber que pode rolar
- Padding das linhas: `py-0.5` em todas as tabelas (Controle, Lançamentos, Cartões)

## Manhã 12/11 — obra-app Controle Mensal (Windows)

- Tabela compacta (text-xs, px-2 py-2, coluna nome 140px, card/table w-full) → 12 meses cabem sem rolagem.
- Meses sempre até dezembro do ano selecionado (inclusive 2028).

**Why:** usuário queria tabela preenchendo a tela como planilha, sem espaços vazios, colunas legíveis em todos os anos.
**How to apply:** para tabelas full-page no obra-app: flex-col container + w-full card + w-full table + min-w-[100px] em colunas de data.
