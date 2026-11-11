import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const git = cmd => execSync(`git ${cmd}`, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

const out = obj => process.stdout.write(JSON.stringify(obj))

try {
  const antes = git('rev-parse HEAD')
  git('pull --ff-only -q')
  const depois = git('rev-parse HEAD')

  if (antes === depois) {
    out({ systemMessage: 'git pull: já estava atualizado' })
    process.exit(0)
  }

  const commits = git(`log --oneline ${antes}..${depois}`)
  const memAlterada = git(`diff --name-only ${antes} ${depois} -- memory`).split('\n').filter(Boolean)

  let ctx = `git pull no início da sessão trouxe commits novos (provavelmente da outra máquina):\n${commits}\n`
  if (memAlterada.length) {
    ctx += `\nArquivos de memória alterados. O MEMORY.md carregado no início pode estar desatualizado; este é o conteúdo atual:\n`
    for (const f of memAlterada) {
      const p = join(dir, f)
      if (existsSync(p)) ctx += `\n===== ${f} =====\n${readFileSync(p, 'utf8')}\n`
    }
  }

  const n = commits.split('\n').length
  out({
    systemMessage: `git pull: ${n} commit(s) novo(s)${memAlterada.length ? `, ${memAlterada.length} arquivo(s) de memória` : ''}`,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ctx },
  })
} catch (e) {
  const msg = (e.stderr || e.message || '').toString().trim().split('\n')[0]
  out({
    systemMessage: `git pull falhou: ${msg}`,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: `O git pull automático do início da sessão falhou: ${msg}. Avise o usuário e não presuma que a memória está atualizada.` },
  })
}
