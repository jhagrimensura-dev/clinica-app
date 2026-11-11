---
name: project_sessao_20260914
description: "Sessão 14/09/2026 — Planilha de Leads: tabela editável inline substitui Google Sheets, import de agosto e setembro"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4f987a3b-f983-45d8-a61c-2c9176ba9bde
---

Nova página **Planilha de Leads** criada para substituir o Google Sheets que as colaboradoras usavam para rastrear leads diariamente.

**O que foi construído:**
- Tabela editável inline (clique numa célula → edita → sai → salva automático)
- Colunas: DATA, NOME, TELEFONE, ORIGEM, CRIATIVO, AGENDOU, COMPARECEU, VENDEU, CONSULTA, VALOR (R$), FOLLOW UP 1–5, OBSERVAÇÃO
- Cards de resumo: Total, Agendou, Compareceu, Vendeu, Valor Total
- Botão `+ Novo Lead` e `+ Adicionar linha` no rodapé
- Botão `× ` sempre visível para apagar linhas
- Botão **"↑ Importar Planilha"** — cola dados copiados do Google Sheets (Ctrl+A+C), analisa e importa em lote
- Navegação por mês/ano independente
- Ícone próprio no sidebar (abaixo do WhatsApp inbox), fora do submenu WhatsApp

**Supabase:**
- Nova tabela `planilha_leads` com RLS via `clinica_master.admin_id`
- Colunas: id, clinica_id, data, nome, telefone, origem, criativo, agendou, compareceu, vendeu, consulta, valor_procedimento, follow_up_1..5, observacao, criado_em
- Totalmente isolada — não conversa com leads_novos, leads_followup, faturamento ou dashboard

**Import realizado:**
- Dados de agosto e setembro 2026 importados com sucesso via botão de importação
- Parsing tolerante: datas DD/MM/YYYY, valores "R$ X.XXX,XX", SIM/NÃO → bool, textos em colunas de follow-up vão para observacao

**Why:** Usuária importava CSV manualmente todo dia — agora os leads ficam direto no sistema.
**How to apply:** A planilha é autônoma. Se precisar conectar com outros módulos futuramente, conversar com usuário antes — ela disse explicitamente que só quer testar sem afetar o restante.
