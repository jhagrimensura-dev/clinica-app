# Análise de vídeos

Ferramenta local (não vai para o site) para "assistir" vídeos da Dra. Amanda: quadros + transcrição.

```bash
cd scripts/video-analise
npm install          # 1ª vez em cada máquina (PC/Mac)
npm run baixar       # baixa os vídeos listados em alvos.json para videos/
npm run quadros      # extrai quadros (0s, 0.5s, 1s, 2s, 3s e depois a cada 5s) para quadros/
npm run transcrever  # transcreve o áudio com Whisper (pt) → resultados/transcricoes.json
```

- Lê `.env.local` da raiz do projeto (SUPABASE_URL + SUPABASE_SERVICE_KEY) para pegar o token Meta salvo em `configuracoes.instagram_ads_config`.
- `videos/`, `quadros/` e `audio/` ficam fora do git. `resultados/` vai para o git.
