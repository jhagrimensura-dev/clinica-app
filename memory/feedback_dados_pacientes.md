---
name: feedback-dados-pacientes
description: "Nunca gravar nomes de pacientes, fotos ou avaliações de resultado no repositório (memory/ vai pro GitHub)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1b73ebff-9f1f-4bbc-846d-d7c95cc44209
  modified: 2026-11-21T14:53:15.959Z
---

Dados de pacientes (nome + foto + avaliação de resultado/procedimento) ficam só no Drive privado do João (pasta "Claude") ou no Supabase, nunca em arquivos do repo nem na memória.

**Why:** memory/ e scripts/ são commitados e enviados ao GitHub; dado de saúde de paciente não pode vazar. Uma gravação com ranking de pacientes foi bloqueada em 2026-11-21 por esse motivo.
**How to apply:** na memória, guardar só ponteiros (IDs de arquivos no Drive). Fotos baixadas ficam em scripts/video-analise/fotos/ (gitignored). Ver [[project-sessao-20261121]].
