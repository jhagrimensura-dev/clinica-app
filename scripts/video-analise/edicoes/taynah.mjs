import ffmpeg from 'ffmpeg-static'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

process.chdir(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')))
const SRC = '../videos/ad_caro1_o_que_mais_incomodava.mp4'
const FOTO = '../fotos/taynah_antes_depois.jpg'
const PALAVRAS = JSON.parse(fs.readFileSync('../resultados/palavras/ad_caro1_o_que_mais_incomodava.json', 'utf8'))
const OUT = 'taynah_v1.mp4'
const FONTS = 'tmp/fonts'
fs.mkdirSync('tmp/fonts', { recursive: true })
for (const f of ['C:/Windows/Fonts/arialbd.ttf', 'C:/Windows/Fonts/arial.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf']) if (fs.existsSync(f)) fs.copyFileSync(f, 'tmp/fonts/' + path.basename(f))
fs.mkdirSync('tmp', { recursive: true })
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

const CORRECOES = { 'Thaina': 'Taynah', 'manda': 'Amanda', 'amanda': 'Amanda', 'bigote': 'bigode', 'humanização,': 'harmonização,', 'meus': 'meus', 'no': 'no' }
const corrige = (w, prox) => {
  if (w === 'no' && prox === 'meus') return 'nos'
  return CORRECOES[w] ?? w
}

// 1. foto antes/depois em tela cheia 720x1280 (fundo desfocado + foto inteira)
run(['-i', FOTO, '-filter_complex',
  '[0]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=30[bg];[0]scale=720:-2[fg];[bg][fg]overlay=0:(H-h)/2',
  '-frames:v', '1', 'tmp/foto_720.png'])

// 2. cortes
const partes = []
CORTES.forEach((c, i) => {
  const out = `tmp/parte${i}.mp4`, dur = c.fim - c.ini
  const vf = 'scale=720:1280,fps=30,setsar=1' + (i === 0 ? `[v];movie=tmp/foto_720.png[f];[v][f]overlay=0:0:enable='lt(t,${GANCHO_S})'` : '')
  run(['-ss', String(c.ini), '-to', String(c.fim), '-i', SRC,
    '-filter_complex', `[0:v]${vf}[vo];[0:a]aresample=44100,afade=t=in:d=0.05,afade=t=out:st=${(dur - 0.08).toFixed(2)}:d=0.08[ao]`,
    '-map', '[vo]', '-map', '[ao]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', out])
  partes.push(out)
})

// 3. cartela final
run(['-loop', '1', '-t', String(FINAL_S), '-i', 'tmp/foto_720.png', '-f', 'lavfi', '-t', String(FINAL_S), '-i', 'anullsrc=r=44100:cl=stereo',
  '-vf', 'fps=30,setsar=1,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-shortest', 'tmp/final.mp4'])
partes.push('tmp/final.mp4')

// 4. concatena
fs.writeFileSync('tmp/lista.txt', partes.map(p => `file '${path.basename(p)}'`).join('\n'))
run(['-f', 'concat', '-safe', '0', '-i', 'tmp/lista.txt', '-c', 'copy', 'tmp/montado.mp4'])

// 5. legendas (ASS) remapeadas para a nova linha do tempo
const ts = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = (s % 60).toFixed(2).padStart(5, '0'); return `${h}:${String(m).padStart(2, '0')}:${x}` }
const linhas = []
let offset = 0
CORTES.forEach(c => {
  const ws = PALAVRAS.filter(w => w[0] >= c.ini - 0.05 && w[1] <= c.fim + 0.1)
  let grupo = []
  const fecha = () => { if (!grupo.length) return; linhas.push({ a: grupo[0][0] - c.ini + offset, b: grupo.at(-1)[1] - c.ini + offset, t: grupo.map(g => g[2]).join(' ') }); grupo = [] }
  ws.forEach((w, i) => {
    grupo.push([w[0], w[1], corrige(w[2], ws[i + 1]?.[2])])
    const curta = /^(o|a|os|as|de|da|do|no|na|nos|e|que|com|seu|sua|meu|um|uma|em|se|eu|ela)$/i.test(w[2])
    if ((grupo.length >= 4 && !curta) || grupo.length >= 6 || /[.,?!]$/.test(w[2])) fecha()
  })
  fecha()
  offset += c.fim - c.ini
})
for (let i = 0; i < linhas.length - 1; i++) linhas[i].b = Math.min(Math.max(linhas[i].b, linhas[i].a + 0.6), linhas[i + 1].a)

const total = offset + FINAL_S
const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Arial,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,3,14,0,2,40,40,250,1
Style: Topo,Arial,50,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,3,16,0,8,40,40,110,1
Style: Cta,Arial,48,&H00FFFFFF,&H00FFFFFF,&H00305A8C,&H00B4785A,1,0,0,0,100,100,0,0,3,18,0,2,50,50,170,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 1,${ts(0)},${ts(GANCHO_S)},Topo,,0,0,0,,HARMONIZAÇÃO QUE NÃO\\NMUDA O SEU ROSTO
Dialogue: 1,${ts(CORTES[0].fim - CORTES[0].ini)},${ts(CORTES[0].fim - CORTES[0].ini + 3)},Topo,,0,0,0,,Taynah, paciente há 10 anos
${linhas.map(l => `Dialogue: 0,${ts(l.a)},${ts(l.b)},Leg,,0,0,0,,${l.t}`).join('\n')}
Dialogue: 1,${ts(offset)},${ts(total)},Topo,,0,0,0,,Quer um resultado\\Nnatural assim?
Dialogue: 1,${ts(offset)},${ts(total)},Cta,,0,0,0,,Toque em\\NENVIAR MENSAGEM\\Ne fale com a equipe\\Nda Dra. Amanda Lima
`
fs.writeFileSync('tmp/legendas.ass', ass)

// 6. queima legendas
run(['-i', 'tmp/montado.mp4', '-vf', `subtitles=tmp/legendas.ass:fontsdir=${FONTS}`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'copy', '-movflags', '+faststart', OUT])
console.log('OK', OUT, `${total.toFixed(1)}s`, `${linhas.length} legendas`)
