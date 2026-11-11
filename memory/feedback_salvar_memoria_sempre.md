---
name: feedback-salvar-memoria-sempre
description: Atualizar o arquivo de memória da sessão durante a conversa, sem esperar pedido, e commitar/pushar memory/
metadata:
  type: feedback
---

Atualizar `memory/project_sessao_YYYYMMDD.md` ao longo da sessão sempre que algo relevante acontecer (feature feita, decisão tomada, assunto iniciado e pausado), e commitar + pushar `memory/` em seguida.

**Why:** em 2026-11-11 o usuário perguntou "vc nao esta salvando as memorias de conversa?". Ele espera que as conversas fiquem registradas sem precisar pedir, já que alterna entre o Mac e o PC Windows.
Isso inclui o que é conversado, não só o código: elogios, opiniões e pedidos em ordem cronológica, numa seção "Conversa" do arquivo da sessão. Ele quer abrir o Claude na outra máquina e eu saber de tudo.

**How to apply:** depois de cada marco da sessão, atualizar o arquivo da sessão e o MEMORY.md, e fazer o commit "docs: memória ..." com push. Relaciona-se com [[feedback_atualizar_memoria]] e [[project-sessao-20261111]].
