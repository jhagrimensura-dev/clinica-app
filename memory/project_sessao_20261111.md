---
name: project-sessao-20261111
description: Sessão 2026-11-11 — setup do PC Windows: memória sincronizada via junction + fix setup-memory-sync.bat
metadata:
  type: project
---

Primeira sessão no PC Windows (`C:\Users\User\clinica-app`).

- Memória sincronizada: `~/.claude/projects/C--Users-User-clinica-app/memory` é uma junction para `repo/memory/` (mklink /J, não precisa admin).
- `scripts/setup-memory-sync.bat` corrigido (commit 52db1a4): path era `-C-Users-...`, o certo é `C--Users-...` (`:` e `\` viram `-`); usa junction; detecta se já está configurado; CRLF e sem travessão (quebrava o cmd).
- Git identity configurada só no repo do PC: Joao Henrique.
- Vercel CLI não instalado no PC — instalar com `npm i -g vercel` antes de precisar de deploy.

**Why:** usuário trabalha alternando Mac e Windows e quer a mesma memória nos dois.
**How to apply:** `git pull` ao começar e commitar `memory/` ao terminar, em qualquer máquina. Ver [[project-pendencias]].
