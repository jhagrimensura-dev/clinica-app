import ffmpeg from 'ffmpeg-static'
import { execFileSync } from 'child_process'
import fs from 'fs'

fs.mkdirSync('quadros', { recursive: true })
const dur = f => { try { execFileSync(ffmpeg, ['-i', f], { stdio: 'pipe' }) } catch (e) { const m = String(e.stderr).match(/Duration: (\d+):(\d+):([\d.]+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0 } return 0 }

for (const v of fs.readdirSync('videos').filter(f => f.endsWith('.mp4'))) {
  const nome = v.replace('.mp4', ''), d = dur(`videos/${v}`)
  const tempos = [0, 0.5, 1, 2, 3]
  for (let t = 5; t < d; t += 5) tempos.push(t)
  for (const t of tempos) {
    execFileSync(ffmpeg, ['-y', '-ss', String(t), '-i', `videos/${v}`, '-frames:v', '1', '-vf', 'scale=360:-2', `quadros/${nome}__${String(t).replace('.', '_')}s.jpg`], { stdio: 'pipe' })
  }
  console.log(nome, `${d.toFixed(1)}s`, `${tempos.length} quadros`)
}
