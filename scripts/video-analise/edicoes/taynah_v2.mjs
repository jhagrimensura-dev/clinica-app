import ffmpeg from 'ffmpeg-static'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// v2: legenda estilo premium (Montserrat + Playfair Display itálico na palavra-chave), palavra por palavra, sem caixa
process.chdir(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')))
const SRC = '../videos/ad_caro1_o_que_mais_incomodava.mp4'
const FOTO = '../fotos/taynah_antes_depois.jpg'
const PALAVRAS = JSON.parse(fs.readFileSync('../resultados/palavras/ad_caro1_o_que_mais_incomodava.json', 'utf8'))
const OUT = 'taynah_v2.mp4'
const FONTS = '../fontes'
const TMP = 'tmp2'
fs.mkdirSync(TMP, { recursive: true })
const run = args => execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' })

const CORTES = [
  { ini: 34.85, fim: 45.45 },
  { ini: 8.25, fim: 18.55 },
  { ini: 47.9, fim: 52.3 },
  { ini: 58.45, fim: 65.2 },
  { ini: 73.8, fim: 76.65 },
]
const GANCHO_S = 3
const FINAL_S = 3.5
const FAIXA = { x: 160, y: 955, w: 400, h: 75 }

const CORRECOES = { Thaina: 'Taynah', manda: 'Amanda', amanda: 'Amanda', bigote: 'bigode', 'humanização,': 'harmonização,' }
const corrige = (w, prox) => (w === 'no' && prox === 'meus') ? 'nos' : (CORRECOES[w] ?? w)
const CHAVE = /^(harmoniza|rosto|realça|beleza|sutilmente|melhora|transforma|idade|bigode|olheiras|lábios|medo|satisfeita|autoestima|espelho|reconhecer|bonita)$/i

const SERIF = t => `{\\fnPlayfair Display\\i1\\b0\\fs${'$FS'}}${t}{\\r}`
const destaca = (txt, fs) => SERIF(txt).replace('$FS', fs)

// 1. foto antes/depois 720x1280
run(['-i', FOTO, '-filter_complex',
  '[0]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=30[bg];[0]scale=720:-2[fg];[bg][fg]overlay=0:(H-h)/2',
  '-frames:v', '1', `${TMP}/foto_720.png`])

// 2. cortes (desfoca a faixa da legenda antiga gravada no vídeo)
const partes = []
CORTES.forEach((c, i) => {
  const out = `${TMP}/parte${i}.mp4`, dur = c.fim - c.ini
  let vf = `[0:v]scale=720:1280,fps=30,setsar=1,split[a][b];[b]crop=${FAIXA.w}:${FAIXA.h}:${FAIXA.x}:${FAIXA.y},boxblur=10:4[bl];[a][bl]overlay=${FAIXA.x}:${FAIXA.y}[v0]`
  vf += i === 0 ? `;movie=${TMP}/foto_720.png[f];[v0][f]overlay=0:0:enable='lt(t,${GANCHO_S})'[vo]` : ';[v0]null[vo]'
  run(['-ss', String(c.ini), '-to', String(c.fim), '-i', SRC,
    '-filter_complex', `${vf};[0:a]aresample=44100,afade=t=in:d=0.05,afade=t=out:st=${(dur - 0.08).toFixed(2)}:d=0.08[ao]`,
    '-map', '[vo]', '-map', '[ao]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', out])
  partes.push(out)
})

// 3. cartela final
run(['-loop', '1', '-t', String(FINAL_S), '-i', `${TMP}/foto_720.png`, '-f', 'lavfi', '-t', String(FINAL_S), '-i', 'anullsrc=r=44100:cl=stereo',
  '-vf', 'fps=30,setsar=1,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-shortest', `${TMP}/final.mp4`])
partes.push(`${TMP}/final.mp4`)

// 4. concatena
fs.writeFileSync(`${TMP}/lista.txt`, partes.map(p => `file '${path.basename(p)}'`).join('\n'))
run(['-f', 'concat', '-safe', '0', '-i', `${TMP}/lista.txt`, '-c', 'copy', `${TMP}/montado.mp4`])

// 5. legendas palavra por palavra
const ts = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = (s % 60).toFixed(2).padStart(5, '0'); return `${h}:${String(m).padStart(2, '0')}:${x}` }
const grupos = []
let offset = 0
CORTES.forEach(c => {
  const ws = PALAVRAS.filter(w => w[0] >= c.ini - 0.05 && w[1] <= c.fim + 0.1)
  let g = []
  const fecha = () => { if (g.length) grupos.push(g); g = [] }
  ws.forEach((w, i) => {
    g.push({ a: w[0] - c.ini + offset, b: w[1] - c.ini + offset, t: corrige(w[2], ws[i + 1]?.[2]) })
    const curta = /^(o|a|os|as|de|da|do|no|na|nos|e|que|com|seu|sua|meu|um|uma|em|se|eu|ela)$/i.test(w[2])
    if ((g.length >= 4 && !curta) || g.length >= 6 || /[.,?!]$/.test(w[2])) fecha()
  })
  fecha()
  offset += c.fim - c.ini
})
const eventos = []
grupos.forEach((g, gi) => {
  const fim = Math.min(Math.max(g.at(-1).b + 0.25, g[0].a + 0.7), grupos[gi + 1]?.[0].a ?? Infinity)
  let usouChave = false
  const fmt = g.map(w => {
    const limpa = w.t.replace(/[.,?!]/g, '')
    if (!usouChave && CHAVE.test(limpa)) { usouChave = true; return destaca(w.t, 58) }
    return w.t
  })
  g.forEach((w, i) => {
    const b = i < g.length - 1 ? g[i + 1].a : fim
    if (b <= w.a) return
    const visivel = fmt.slice(0, i + 1).join(' ')
    const oculto = fmt.slice(i + 1).map(x => x.replace(/\{[^}]*\}/g, '')).join(' ')
    eventos.push(`Dialogue: 0,${ts(w.a)},${ts(b)},Leg,,0,0,0,,${visivel}${oculto ? `{\\alpha&HFF&} ${oculto}` : ''}`)
  })
})

const total = offset + FINAL_S
const fimGancho = CORTES[0].fim - CORTES[0].ini
const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Montserrat SemiBold,44,&H00FFFFFF,&H00FFFFFF,&H64000000,&H96000000,0,0,0,0,100,100,0,0,1,1.2,2.5,2,60,60,262,1
Style: Topo,Montserrat SemiBold,54,&H00FFFFFF,&H00FFFFFF,&H64000000,&H96000000,0,0,0,0,100,100,0,0,1,1.4,3,8,50,50,120,1
Style: Rotulo,Montserrat SemiBold,30,&H00FFFFFF,&H00FFFFFF,&H64000000,&H96000000,0,0,0,0,100,100,1,0,1,1,2,8,50,50,130,1
Style: Cta,Montserrat SemiBold,40,&H00FFFFFF,&H00FFFFFF,&H64000000,&H96000000,0,0,0,0,100,100,0,0,1,1.4,3,2,50,50,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 1,${ts(0)},${ts(GANCHO_S)},Topo,,0,0,0,,{\\fad(150,0)}Harmonização que\\N${destaca('não muda', 76)} o seu rosto
Dialogue: 1,${ts(fimGancho)},${ts(fimGancho + 3)},Rotulo,,0,0,0,,{\\fad(200,200)}TAYNAH · PACIENTE HÁ 10 ANOS
${eventos.join('\n')}
Dialogue: 1,${ts(offset)},${ts(total)},Topo,,0,0,0,,{\\fad(200,0)}Quer um resultado\\N${destaca('natural', 76)} assim?
Dialogue: 1,${ts(offset + 0.4)},${ts(total)},Cta,,0,0,0,,{\\fad(250,0)}Toque em ENVIAR MENSAGEM\\Ne fale com a equipe da\\N${destaca('Dra. Amanda Lima', 52)}
`
fs.writeFileSync(`${TMP}/legendas.ass`, ass)

// 6. queima legendas
run(['-i', `${TMP}/montado.mp4`, '-vf', `subtitles=${TMP}/legendas.ass:fontsdir=${FONTS}`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'copy', '-movflags', '+faststart', OUT])
console.log('OK', OUT, `${total.toFixed(1)}s`, `${grupos.length} frases`, `${eventos.length} eventos`)
