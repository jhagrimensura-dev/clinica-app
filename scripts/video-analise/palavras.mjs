import { pipeline } from '@huggingface/transformers'
import fs from 'fs'
const [nome] = process.argv.slice(2)
const buf = fs.readFileSync(`audio/${nome}.f32`), audio = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4)
const asr = await pipeline('automatic-speech-recognition', process.env.WHISPER_MODELO || 'onnx-community/whisper-small_timestamped', { dtype: 'q8' })
const out = await asr(audio, { language: 'portuguese', task: 'transcribe', chunk_length_s: 30, return_timestamps: 'word' })
fs.mkdirSync('resultados/palavras', { recursive: true })
fs.writeFileSync(`resultados/palavras/${nome}.json`, JSON.stringify(out.chunks.map(c => [c.timestamp[0], c.timestamp[1], c.text.trim()])))
console.log(out.chunks.map(c => `${c.timestamp[0].toFixed(2)} ${c.text.trim()}`).join(' | '))
