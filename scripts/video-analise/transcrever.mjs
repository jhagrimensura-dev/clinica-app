import ffmpeg from 'ffmpeg-static'
import { execFileSync } from 'child_process'
import { pipeline } from '@huggingface/transformers'
import fs from 'fs'

const MODELO = process.env.WHISPER_MODELO || 'onnx-community/whisper-small'
fs.mkdirSync('audio', { recursive: true }); fs.mkdirSync('resultados', { recursive: true })
const saida = 'resultados/transcricoes.json'
const res = fs.existsSync(saida) ? JSON.parse(fs.readFileSync(saida, 'utf8')) : {}
const asr = await pipeline('automatic-speech-recognition', MODELO, { dtype: 'q8' })

for (const v of fs.readdirSync('videos').filter(f => f.endsWith('.mp4'))) {
  const nome = v.replace('.mp4', '')
  if (res[nome]) continue
  const raw = `audio/${nome}.f32`
  try {
    execFileSync(ffmpeg, ['-y', '-i', `videos/${v}`, '-ac', '1', '-ar', '16000', '-f', 'f32le', raw], { stdio: 'pipe' })
  } catch {
    res[nome] = { texto: '', semAudio: true, obs: 'Arquivo sem faixa de áudio (a API do Instagram remove o som de reels com música licenciada)' }
    fs.writeFileSync(saida, JSON.stringify(res, null, 1))
    console.log(`\n== ${nome}\n(sem áudio)`)
    continue
  }
  const buf = fs.readFileSync(raw), audio = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4)
  const out = await asr(audio, { language: 'portuguese', task: 'transcribe', chunk_length_s: 30, return_timestamps: true })
  res[nome] = { texto: out.text.trim(), trechos: (out.chunks || []).map(c => ({ t: c.timestamp, texto: c.text.trim() })) }
  fs.writeFileSync(saida, JSON.stringify(res, null, 1))
  console.log(`\n== ${nome}\n${res[nome].texto.slice(0, 300)}`)
}
