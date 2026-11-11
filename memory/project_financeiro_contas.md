---
name: project-financeiro-contas
description: Status das features do módulo Financeiro — o que foi implementado e o que ainda está pendente
metadata: 
  node_type: memory
  type: project
  originSessionId: a9e4288f-292a-4d16-b527-d7e3e7a217fa
---

## Financeiro — implementado em 2026-06-01

### Campos ocultos (hide/show)
- Cada campo do Financeiro tem um botão 👁 (aparece no hover) para ocultar
- Campos ocultos ficam numa seção colapsável "Campos ocultos (N)" no fundo de cada bloco
- Botão "Restaurar" traz o campo de volta
- Campos custom (criados pelo usuário) têm também um ✕ para deletar permanentemente
- Estado salvo em localStorage como `fin_ocultos`
- Contexto: `src/context/FinanceiroContext.jsx` — funções `toggleOculto`, `ocultos`

### Contas a Pagar
- Página dedicada em `src/pages/ContasPagar.jsx`
- Contexto em `src/context/ContasContext.jsx` — dados em localStorage `contas_pagar`
- Acessível via submenu na Sidebar: clicar em Financeiro → expande → "📌 Contas a Pagar"
- Funcionalidades: cadastrar conta (avulsa ou recorrente por N meses), marcar como paga, remover
- Ao marcar como paga: preenche automaticamente o campo vinculado no Financeiro (`setValor`)
- Cards de resumo: Total / Pago / Pendente / Atrasado
- Barra de progresso de pagamento do mês
- Grupos: Atrasadas / Pendentes / Pagas

**Why:** usuário quer controle de vencimentos integrado ao financeiro
**How to apply:** ao mexer no Financeiro, lembrar que Contas a Pagar é um submenu filho dele na sidebar
