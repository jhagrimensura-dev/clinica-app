import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJ_MEM = path.join(REPO, 'memoria-projetos')
const CLAUDE = path.join(os.homedir(), '.claude')
const SCRIPT = path.join(REPO, 'scripts', 'memoria-sync.mjs').replace(/\\/g, '/')
const PATHS = 'memory memoria-projetos'

const mode = process.argv[2] || 'start'
const global = process.argv.includes('--global')

let input = {}
try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}') } catch {}
const cwd = path.resolve(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd())
const naRepo = cwd.toLowerCase() === REPO.toLowerCase() || cwd.toLowerCase().startsWith(REPO.toLowerCase() + path.sep)

if (global && naRepo) process.exit(0)

const git = cmd => execSync(`git ${cmd}`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const out = obj => process.stdout.write(JSON.stringify(obj))

function commitMemoria(msg) {
  fs.mkdirSync(PROJ_MEM, { recursive: true })
  if (!git(`status --porcelain -- ${PATHS}`)) return false
  git(`add -A -- ${PATHS}`)
  git(`commit -q -m "${msg}" -- ${PATHS}`)
  return true
}

function pullPush() {
  try {
    git('pull --rebase --autostash -q')
  } catch (e) {
    try { git('rebase --abort') } catch {}
    throw e
  }
  if (git('rev-list --count @{u}..HEAD') === '0') return true
  const arquivos = git('diff --name-only @{u}..HEAD').split('\n').filter(Boolean)
  if (!arquivos.every(f => f.startsWith('memory/') || f.startsWith('memoria-projetos/'))) return false
  git('push -q')
  return true
}

function instalarHooksGlobais() {
  const f = path.join(CLAUDE, 'settings.json')
  let s = {}
  try { s = JSON.parse(fs.readFileSync(f, 'utf8')) } catch {}
  s.hooks ??= {}
  let mudou = false
  for (const [ev, arg, extra] of [['SessionStart', 'start', { matcher: 'startup|resume' }], ['SessionEnd', 'end', {}]]) {
    s.hooks[ev] ??= []
    if (JSON.stringify(s.hooks[ev]).includes('memoria-sync.mjs')) continue
    s.hooks[ev].push({ ...extra, hooks: [{ type: 'command', command: `node "${SCRIPT}" ${arg} --global`, timeout: 60 }] })
    mudou = true
  }
  if (mudou) fs.writeFileSync(f, JSON.stringify(s, null, 2))
  return mudou
}

function cwdDoProjeto(dir) {
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
    const linhas = fs.readFileSync(path.join(dir, f), 'utf8').split('\n')
    for (const l of linhas) {
      const m = l.match(/"cwd":"((?:[^"\\]|\\.)*)"/)
      if (m) return JSON.parse(`"${m[1]}"`)
    }
  }
  return null
}

const ehLink = p => { try { return fs.lstatSync(p).isSymbolicLink() } catch { return false } }
const linkar = (alvo, p) => fs.symlinkSync(alvo, p, process.platform === 'win32' ? 'junction' : 'dir')

function migrar() {
  const migrados = []
  const base = path.join(CLAUDE, 'projects')
  if (!fs.existsSync(base)) return migrados
  for (const d of fs.readdirSync(base)) {
    const dir = path.join(base, d)
    const mem = path.join(dir, 'memory')
    if (!fs.existsSync(mem) || ehLink(mem) || !fs.readdirSync(mem).length) continue
    const pcwd = cwdDoProjeto(dir)
    if (!pcwd) continue
    const resolvido = path.resolve(pcwd)
    const alvo = resolvido.toLowerCase() === REPO.toLowerCase() ? path.join(REPO, 'memory') : path.join(PROJ_MEM, path.basename(resolvido))
    fs.mkdirSync(alvo, { recursive: true })
    for (const f of fs.readdirSync(mem)) {
      const src = path.join(mem, f)
      let dst = path.join(alvo, f)
      if (fs.existsSync(dst)) {
        if (fs.statSync(src).isFile() && fs.readFileSync(src, 'utf8') === fs.readFileSync(dst, 'utf8')) continue
        const ext = path.extname(f)
        dst = path.join(alvo, `${path.basename(f, ext)}.${os.hostname()}${ext}`)
      }
      fs.cpSync(src, dst, { recursive: true })
    }
    fs.renameSync(mem, `${mem}.bak-${Date.now()}`)
    linkar(alvo, mem)
    migrados.push(path.basename(alvo))
  }
  return migrados
}

function linkarAtual() {
  if (naRepo || !input.transcript_path) return
  const mem = path.join(path.dirname(input.transcript_path), 'memory')
  if (fs.existsSync(mem) || ehLink(mem)) return
  const alvo = path.join(PROJ_MEM, path.basename(cwd))
  fs.mkdirSync(alvo, { recursive: true })
  fs.mkdirSync(path.dirname(mem), { recursive: true })
  linkar(alvo, mem)
}

if (mode === 'end') {
  try { commitMemoria('memory: sync automático (fim de sessão)'); pullPush() } catch {}
  process.exit(0)
}

try {
  const msgs = []
  if (commitMemoria('memory: sync automático (sessão anterior)')) msgs.push('memória pendente commitada')
  const antes = git('rev-parse HEAD')
  const pushOk = pullPush()
  const depois = git('rev-parse HEAD')

  if (instalarHooksGlobais()) msgs.push('hooks globais instalados')
  const migrados = migrar()
  if (migrados.length) msgs.push(`memória migrada: ${migrados.join(', ')}`)
  linkarAtual()
  if (commitMemoria('memory: migração para memória compartilhada')) pullPush()

  let ctx = ''
  if (!pushOk) {
    msgs.push('push NÃO feito: há commits de código não enviados')
    ctx += 'Push automático da memória não foi feito porque há commits de código locais não enviados na clinica-app. Avise o usuário.\n'
  }
  const projetos = fs.existsSync(PROJ_MEM) ? fs.readdirSync(PROJ_MEM).filter(f => fs.statSync(path.join(PROJ_MEM, f)).isDirectory()) : []
  ctx += `Memória compartilhada PC+Mac fica no repo clinica-app (${REPO}): memory/ = clinica-app, memoria-projetos/<projeto>/ = demais projetos. Projetos com memória: clinica-app${projetos.length ? ', ' + projetos.join(', ') : ''}.\n`
  const geral = path.join(PROJ_MEM, 'GERAL.md')
  if (fs.existsSync(geral)) ctx += `\n===== memoria-projetos/GERAL.md =====\n${fs.readFileSync(geral, 'utf8')}\n`

  if (antes !== depois) {
    const commits = git(`log --oneline ${antes}..${depois}`)
    msgs.push(`${commits.split('\n').length} commit(s) novo(s)`)
    const pasta = naRepo ? 'memory' : `memoria-projetos/${path.basename(cwd)}`
    const alterados = git(`diff --name-only ${antes} ${depois} -- ${pasta}`).split('\n').filter(Boolean)
    if (alterados.length) {
      ctx += `\ngit pull trouxe memória nova da outra máquina. O MEMORY.md carregado no início pode estar desatualizado; conteúdo atual:\n`
      for (const f of alterados) {
        const p = path.join(REPO, f)
        if (fs.existsSync(p)) ctx += `\n===== ${f} =====\n${fs.readFileSync(p, 'utf8')}\n`
      }
    }
  }

  out({
    systemMessage: `memória sync: ${msgs.length ? msgs.join('; ') : 'já estava atualizada'}`,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ctx },
  })
} catch (e) {
  const msg = (e.stderr || e.message || '').toString().trim().split('\n')[0]
  out({
    systemMessage: `memória sync falhou: ${msg}`,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: `O sync automático de memória falhou: ${msg}. Avise o usuário e não presuma que a memória está atualizada.` },
  })
}
