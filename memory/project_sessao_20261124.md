---
name: project-sessao-20261124
description: "Sessão 2026-11-24 — status geral, levantamento dos casos da pasta CASOS PARA POSTAR p/ autorização da doutora, explicação de correção de luz e ferramentas de edição"
metadata:
  type: project
---

**Status pedido:** repassei o estado após 21/11 (Meta Ads conectado, diagnóstico tráfego, Leads Novos reconectado, vídeos Taynah v1/v2, concorrente). Pendências seguem em [[project-sessao-20261121]] e [[project-pendencias]]. Token Meta expira 2027-01-20 ([[project-token-meta-expira]]).

**Casos para anúncio:**
- Pasta Drive "CASOS PARA POSTAR" (id 1PipIbh25w5pTRIaW_aQupsbKsspLBlDC): 28 pacientes na raiz + 15 em "Z. Casos em pausa" (id 1WRmUWISCb3ybp7XInoBGmCDkFhFIQO2o) = 43.
- 12 já avaliados na planilha privada Drive/Claude (id 13T5om6RL4oK7MjhpDiZudkbVtvr0QI25CPDr1onui1w), 16 da raiz ainda NÃO avaliados, 15 em pausa não avaliados. Nomes NÃO ficam no repo ([[feedback-dados-pacientes]]) — consultar a planilha/pasta.
- Expliquei ao usuário: os 6 primeiros do ranking são os melhores por qualidade de foto antes/depois (mesmo ângulo/fundo/luz, resultado natural); o ranking é de FOTO, não de vídeo. 2 dos avaliados já têm vídeo (ver coluna "Tem vídeo?" na planilha).
- Usuário vai mandar a lista inteira para a doutora decidir quem autoriza. Ao receber: marcar coluna "Autorizou uso em anúncio?" na planilha e avaliar fotos dos autorizados ainda não avaliados. Pedir 1 frase da história de cada para os vídeos.

**Correção de luz (pergunta do usuário):**
- Dá para equalizar brilho/contraste/temperatura de cor/recorte com ffmpeg, aplicado IGUAL nas duas fotos. Não corrige maquiagem, cabelo, ângulo. Nunca retocar o rosto nem melhorar o "depois" (propaganda enganosa — conselho profissional/Meta).
- Vale testar nos 🟡 (luz/cor); não resolve nos 🔴 (maquiagem/estúdio/ângulo).
- Ofereci teste de correção de luz num caso com vídeo — aguardando resposta.

**Ferramentas explicadas:** edição via scripts próprios (scripts/video-analise/): ffmpeg (corte, legenda, cor), Whisper (transcrição palavra por palavra), fontes Montserrat/Playfair (OFL). Confiro por quadros extraídos — ajuste fino depende do retorno do usuário.

**Teste de luz (24/11):** feito num caso 🟡 a partir da montagem pronta da pasta (SCRL_*). Método: medir cor média da pele (testa+bochecha) em cada metade com ffmpeg crop+scale 1x1, levar as duas metades ao meio-termo com colorchannelmixer (ganhos opostos, nada no rosto). Resultado: tom de pele igualado (antes era o depois mais avermelhado). Fundo, cabelo e batom continuam diferentes — luz não resolve isso. Arquivos no Drive/Claude. Conversor HEIC: scripts/video-analise/heic.mjs (npm heic-convert). Fotos em fotos/ (gitignored).

**obra-app (24/11):** Cheque (campo Vencimento reusa data_compra, mês calculado) + Itaú PF da Amanda — commit b1de936. Lição: PC estava 6 commits atrás do GitHub (feitos no Mac) e o 1º deploy saiu sem eles — sempre `git pull` no obra-app antes de mexer/deployar.
