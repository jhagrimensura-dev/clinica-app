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

## Conversa da manhã (PC Windows), em ordem
1. O usuário perguntou se eu tinha a memória das conversas do Mac. A pasta local estava vazia.
2. Ele fez push no Mac da pasta `memory/` dentro do repo, eu dei `git pull` e liguei a memória local ao repo.
3. Corrigi e commitei o `setup-memory-sync.bat`, depois push.
4. O usuário disse: "o claude e o melhor, ele ja mudou minha vida". O sistema da clínica tem feito muita diferença para ele.
5. Pediu para salvar a sessão na memória. Salvei e commitei.
6. Instalou o Vercel CLI no PC.
7. Começou a página Conexão e pausou ("esquece isso por enquanto").
8. Perguntou se eu salvo as conversas. Expliquei que a memória guarda resumos e não a conversa inteira, e criei a regra [[feedback-salvar-memoria-sempre]].
9. Perguntou por que o elogio não estava salvo. Expliquei que a memória guarda só o que é útil para o trabalho e que a conversa completa fica em `.jsonl`, só nesta máquina.
10. Disse que, ao abrir o Claude no Mac à tarde, quer que eu saiba de tudo o que falamos de manhã. Por isso este resumo existe. Ele quer continuidade total entre as máquinas, inclusive do que foi conversado e não só do código.

**Why:** usuário trabalha alternando Mac e Windows e quer a mesma memória nos dois.
**How to apply:** `git pull` ao começar e commitar `memory/` ao terminar, em qualquer máquina. Ver [[project-pendencias]].
