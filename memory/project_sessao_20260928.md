---
name: project_sessao_20260928
description: Sessão 2026-09-28 — Estoque completo + botão Sincronizar no Dashboard + fix banner duplicatas
metadata:
  node_type: memory
  type: project
  originSessionId: current
---

## O que foi feito

### Botão Sincronizar Planilhas no Dashboard
- Adicionado no canto superior direito do Dashboard ao lado do título
- Chama `/api/sync-planilha` via fetch
- Mostra spinner enquanto roda, exibe resultado por 6s: `✓ 76 novos · 94 follow-ups · 172 recorrentes`
- Arquivo: `src/pages/Dashboard.jsx`

### Módulo de Estoque — novo
- Nova página `src/pages/Estoque.jsx`
- Duas tabelas no Supabase criadas via SQL:
  - `estoque_produtos` (id, clinica_id, nome, unidade, fornecedor, estoque_minimo)
  - `estoque_movimentos` (id, clinica_id, produto_id, tipo entrada/saida, quantidade, data, validade, observacao)
- RLS ativado em ambas via policy `clinica_owner`
- Layout inspirado no Clinicorp: lista com ícones sempre visíveis (+, ↕, 🗑, ✏), "Quantidade Disponível X" e "Unidade de Medida UN" separados à direita
- Alertas inline: estoque baixo (vermelho), vencido (vermelho), vence em Xd (laranja)
- Modal para cadastrar produto (nome, unidade, mínimo, fornecedor)
- Modal para registrar movimento (entrada/saída, quantidade, data, validade opcional)
- Busca por nome de produto
- Adicionado na Sidebar com ícone de caixas 3D entre Financeiro e Pacientes

### 32 produtos cadastrados via script Node.js
- Insumos básicos: papel toalha, luvas, gaze, toca, máscara, babador, sabonete, água micelar
- Botox Dysport: 520 unidades (52cx × 10)
- Cânulas Biometik: 3 tamanhos em unidades
- Seringas e agulhas: 6 tipos
- Anestésico: 42 unidades
- Fillers em ml: Restylane (5 tipos), Milimetric (3), Biogelis (2)
- Radiesse: 8 unidades, Sculptra: 5 frascos
- Todos com estoque_minimo = 0 (alertas desativados por enquanto)

### Fix banner duplicatas em Leads Novos
- Banner de "leads duplicados detectados" não tinha como fechar
- Adicionado botão X para dispensar o banner (estado local, some ao clicar)
- Duplicatas reais ainda podem ser resolvidas com "Resolver todas" antes de fechar

**Why:** Usuário queria controle de estoque similar ao Clinicorp + não ser incomodado pelo banner toda hora.

**How to apply:** Ao adicionar produtos via script, usar `crypto.randomUUID()` e inserir produto + movimento de entrada inicial separadamente. O estoque é calculado somando entradas − saídas dos movimentos em runtime (sem coluna de quantidade direta).
