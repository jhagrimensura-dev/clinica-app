---
name: project-sessao-20260611
description: Resumo das features entregues na sessão de 2026-06-11
metadata: 
  node_type: memory
  type: project
  originSessionId: 32cbd0a4-dee5-4855-ac61-a1130d745b96
---

Sessão muito produtiva em 2026-06-11. Tudo deployado em produção (draamandaliima.com.br).

**Why:** Melhorias de UX e correções de nomenclatura no módulo de Faturamento + fix de fotos no WhatsApp Inbox.

**Features entregues:**
1. **Faturamento — renomear Taxa → Consultas (R$)**: card, subtítulo, cabeçalho da tabela, labels do formulário e exportação CSV
2. **Faturamento — alinhamento da tabela**: adicionado `px-3` em todos os `th` e `td`
3. **Faturamento — Receita por Procedimento**: renomeado de "Receita por Serviço"
4. **Faturamento — Procedimentos com preço vinculado**: campo virou select com preços cadastrados; ao selecionar um procedimento, o campo Consultas (R$) é preenchido automaticamente; permite criar novos procedimentos inline; Receita por Procedimento agora mostra valores reais dos lançamentos agrupados por procedimento (salvo em `localStorage` com chave `procedimentos_cadastro`)
5. **WhatsApp Inbox — fotos de perfil**: corrigido campo da Z-API (`link` em vez de `value`); cache não salva mais strings vazias de falhas anteriores; fallback `onError` nas imagens

**How to apply:** Na próxima sessão, esses módulos já estão funcionando. Procedimentos ficam em `localStorage('procedimentos_cadastro')`.
