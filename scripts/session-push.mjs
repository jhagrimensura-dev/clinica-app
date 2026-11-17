import { execSync } from 'node:child_process'

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const git = cmd => execSync(`git ${cmd}`, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

try {
  if (git('status --porcelain -- memory')) {
    git('add memory')
    git('commit -q -m "memory: sync automático (fim de sessão)"')
  }
  if (git('rev-list --count @{u}..HEAD') !== '0') {
    try {
      git('pull --rebase --autostash -q')
    } catch (e) {
      try { git('rebase --abort') } catch {}
      throw e
    }
    git('push -q')
  }
} catch {}
