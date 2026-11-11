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
- Vercel CLI 65.14.0 instalado no PC, logado e linkado ao projeto.
- Python não está instalado no PC (usar bash/node em scripts).
- Página Conexão: iniciada a análise e depois pausada pelo usuário ("esquece isso por enquanto"). Achados: o placeholder `case 'conexao'` não existe mais no App.jsx; o modelo mais próximo é Indicacao.jsx (`getLeadsPorOrigem('indicacao')`); 'Conexão' já é uma das origens em PlanilhaLeads/PlanilhaFollowUp e hoje cai em Leads Novos. Perguntas em aberto: puxar da planilha ou fazer cadastro próprio, onde fica na sidebar, se precisa de um campo "conectado por".

**Why:** usuário trabalha alternando Mac e Windows e quer a mesma memória nos dois.
**How to apply:** `git pull` ao começar e commitar `memory/` ao terminar, em qualquer máquina. Ver [[project-pendencias]].
