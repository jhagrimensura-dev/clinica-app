import ffmpeg from 'ffmpeg-static'
import { execFileSync } from 'child_process'
import fs from 'fs'

fs.mkdirSync('quadros/tiras', { recursive: true })
const nomes = [...new Set(fs.readdirSync('quadros').filter(f => f.endsWith('.jpg')).map(f => f.split('__')[0]))]
for (const n of nomes) {
  const ts = ['0', '0_5', '1', '2', '3'].map(t => `quadros/${n}__${t}s.jpg`).filter(f => fs.existsSync(f))
  const args = ts.flatMap(f => ['-i', f])
  const filtro = ts.map((_, i) => `[${i}:v]scale=240:-2,pad=240:430:(ow-iw)/2:(oh-ih)/2[v${i}]`).join(';') + ';' + ts.map((_, i) => `[v${i}]`).join('') + `hstack=inputs=${ts.length}`
  execFileSync(ffmpeg, ['-y', ...args, '-filter_complex', filtro, `quadros/tiras/${n}.jpg`], { stdio: 'pipe' })
}
console.log(fs.readdirSync('quadros/tiras').join('\n'))
