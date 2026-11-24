import convert from 'heic-convert'
import fs from 'fs'
const [src, dst] = process.argv.slice(2)
const out = await convert({ buffer: fs.readFileSync(src), format: 'JPEG', quality: 0.92 })
fs.writeFileSync(dst, Buffer.from(out))
console.log('ok', dst)
