---
name: feedback-git-pull-antes
description: Sempre dar git pull antes de editar/deployar qualquer projeto — João trabalha em PC e Mac
metadata:
  type: feedback
---

Antes de editar ou rodar `vercel --prod` em qualquer projeto (clinica-app, obra-app, etc.), rodar `git pull` primeiro.

**Why:** em 2026-11-24 o obra-app no PC estava 6 commits atrás do GitHub (feitos no Mac); o deploy publicou código antigo e apagou temporariamente ajustes de layout/sort em produção, e o push deu conflito. Ver [[project-sessao-20261124]].

**How to apply:** no início de qualquer tarefa de código, `git fetch && git status`; se atrás, `git pull --rebase` antes de mexer.
