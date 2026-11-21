import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const raiz = new URL('../../.env.local', import.meta.url)
const env = Object.fromEntries(fs.readFileSync(raiz, 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const sb = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
const { data: cfg } = await sb.from('configuracoes').select('valor').eq('chave', 'instagram_ads_config')
const T = cfg[0].valor.token, G = 'https://graph.facebook.com/v21.0', IG = '17841407062223101'
const j = u => fetch(u).then(r => r.json())
const alvos = JSON.parse(fs.readFileSync('alvos.json', 'utf8'))
fs.mkdirSync('videos', { recursive: true })
const baixar = async (nome, url) => { const b = Buffer.from(await (await fetch(url)).arrayBuffer()); fs.writeFileSync(`videos/${nome}.mp4`, b); console.log(nome, (b.length / 1e6).toFixed(1) + 'MB') }

let url = `${G}/${IG}/media?fields=permalink,media_type,media_url&limit=50&access_token=${T}`, paginas = 0
const faltam = new Set(Object.keys(alvos.organicos))
while (url && faltam.size && paginas++ < 20) {
  const r = await j(url)
  for (const m of r.data || []) {
    const code = m.permalink.split('/').filter(Boolean).pop()
    if (faltam.has(code) && m.media_url) { await baixar(alvos.organicos[code], m.media_url); faltam.delete(code) }
  }
  url = r.paging?.next
}
for (const c of faltam) console.log('não encontrado/sem vídeo:', c)

const ads = await j(`${G}/act_${alvos.anuncios.conta}/ads?fields=name,creative{video_id,effective_instagram_media_id}&limit=300&access_token=${T}`)
const feitos = new Set()
for (const a of ads.data || []) {
  const nome = Object.entries(alvos.anuncios.nomes).find(([k]) => a.name.trim().startsWith(k))?.[1]
  if (!nome || feitos.has(nome)) continue
  const cr = a.creative || {}
  let src = cr.video_id ? (await j(`${G}/${cr.video_id}?fields=source&access_token=${T}`)).source : null
  if (!src && cr.effective_instagram_media_id) src = (await j(`${G}/${cr.effective_instagram_media_id}?fields=media_url&access_token=${T}`)).media_url
  if (src) { await baixar(nome, src); feitos.add(nome) } else console.log('sem fonte:', nome)
}
