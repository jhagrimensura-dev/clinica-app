---
name: project-sessao-20260706
description: "Sessão 2026-07-06 — Fix QR code WhatsApp (Z-API retorna link wp.me, não imagem)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 77883d1d-45bd-4655-8390-4f149f0913e8
---

## QR Code WhatsApp — fix completo

**Problema:** Z-API não retorna imagem do QR. Retorna URL de vinculação do WhatsApp: `https://wp.me/settings/linked_devices#<token>`.

**Diagnóstico:**
- Primeiro tentativa: proxy server-side da URL → CDN da Z-API rate-limita (`Hit limit. Please wait`) → retornava `data:text/html;base64,...` como src da imagem
- Descoberto via `console.log` no frontend mostrando a resposta completa

**Fix em `api/zapi-qr.js`:**
- Quando `rawValue` começa com `http`: retorna a URL diretamente (não faz proxy)
- `<img src>` carrega imagens sem restrição de CORS; só `fetch()` tem CORS
- Mantém fallback para base64 sem prefixo `data:` (adiciona `data:image/png;base64,`)

**Fix em `src/pages/InboxWhatsApp.jsx`:**
- Instalado `react-qr-code@2.2.0` (`QRCodeSVG`)
- Quando `qrCode.startsWith('http')`: renderiza `<QRCodeSVG value={qrCode} size={176} />` em vez de `<img src>`
- Quando base64: mantém `<img src>` normal

## Auto-refresh do QR

**Problema anterior:** usuário precisava clicar "Gerar QR Code" manualmente. QR expira em ~60s.

**Implementação:**
- `fetchQrCode` virou `useCallback` com deps `[instanciaId, instanciaToken, clientToken]`
- Novo `useEffect`: quando `desconectado` → chama `fetchQrCode()` imediatamente + `setInterval(fetchQrCode, 45000)`
- Não limpa o QR ao renovar — mantém visível com `opacity-40` + spinner overlay
- UI: spinner no primeiro load, overlay "Atualizando QR..." ao renovar, texto "Renova automaticamente a cada 45s"
- Fallback "Tentar novamente" se fetch falhar

**Resultado:** WhatsApp desconectado → QR aparece sozinho → renova a cada 45s → reconecta sem intervenção.
