---
name: feedback-vercel-case
description: Deploy Vercel falha quando src/Pages/ está com P maiúsculo no filesystem macOS
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a9e4288f-292a-4d16-b527-d7e3e7a217fa
---

O diretório `src/pages/` no macOS pode estar nomeado como `src/Pages/` (maiúsculo) no filesystem real, mesmo que o git o rastreie como minúsculo. O Vercel CLI faz upload dos arquivos com o case do filesystem local, e no Linux (case-sensitive) do Vercel o `Pages` ≠ `pages`, quebrando todos os imports.

**Why:** O macOS tem filesystem case-insensitive, então `src/Pages/` e `src/pages/` são o mesmo diretório. Mas quando o CLI do Vercel faz upload, ele usa o nome real do filesystem (maiúsculo). No Linux do Vercel, `./pages/Component` não resolve.

**How to apply:** Se o deploy Vercel falhar com "Could not resolve './pages/X'" mesmo que o git ls-tree mostre lowercase:
1. Verificar com `ls -la src/ | grep -i pages` — se retornar `Pages` (maiúsculo), renomear
2. Corrigir com: `mv src/Pages src/pages_temp && mv src/pages_temp src/pages`
3. Verificar com `ls -la src/` que ficou `pages` (minúsculo)
4. Fazer novo deploy

Também: Vite 8 (rolldown) tem bugs de resolução de arquivos no Vercel. Usar Vite 5.x (`"vite": "^5.4.0"`).
