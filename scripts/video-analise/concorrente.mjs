import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const [usuario, qtd = '6'] = process.argv.slice(2)
const env = Object.fromEntries(fs.readFileSync(new URL('../../.env.local', import.meta.url), 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const sb = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
const { data } = await sb.from('configuracoes').select('valor').eq('chave', 'instagram_ads_config')
const T = data[0].valor.token
const campos = 'id,caption,media_type,media_product_type,like_count,comments_count,timestamp,permalink,media_url'
let after = '', posts = [], perfil
for (let p = 0; p < 6; p++) {
  const r = await fetch(`https://graph.facebook.com/v21.0/17841407062223101?fields=business_discovery.username(${usuario}){username,followers_count,media_count,media.limit(50)${after}{${campos}}}&access_token=${T}`).then(r => r.json())
  if (r.error) { console.log(r.error.message); break }
  perfil = r.business_discovery; posts.push(...(perfil.media?.data || []))
  const cur = perfil.media?.paging?.cursors?.after; if (!cur || !perfil.media?.paging?.next) break
  after = `.after(${cur})`
}
fs.mkdirSync('resultados/concorrentes', { recursive: true })
fs.writeFileSync(`resultados/concorrentes/${usuario}.json`, JSON.stringify({ usuario, seguidores: perfil?.followers_count, posts: posts.map(({ media_url, ...p }) => p) }, null, 1))
const eng = p => (p.like_count || 0) + (p.comments_count || 0) * 3
const reels = posts.filter(p => p.media_type === 'VIDEO' && p.media_url)
console.log(`${usuario}: ${perfil?.followers_count} seguidores, ${posts.length} posts lidos (${reels.length} vídeos), desde ${posts.at(-1)?.timestamp?.slice(0, 10)}`)
fs.mkdirSync('videos', { recursive: true })
const top = [...reels].sort((a, b) => eng(b) - eng(a)).slice(0, +qtd)
for (const [i, p] of top.entries()) {
  const nome = `conc_${usuario.replace(/\W/g, '')}_top${i + 1}`
  fs.writeFileSync(`videos/${nome}.mp4`, Buffer.from(await (await fetch(p.media_url)).arrayBuffer()))
  console.log(`${nome} | ${p.timestamp.slice(0, 10)} | ❤ ${p.like_count} 💬 ${p.comments_count} | ${(p.caption || '').replace(/\s+/g, ' ').slice(0, 90)} | ${p.permalink}`)
}
