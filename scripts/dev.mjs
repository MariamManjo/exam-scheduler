import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildApiRoutes } from './build-api.mjs'
import { loadEnvFiles } from './load-env.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function spawnProcess(command, args, label) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[dev] ${label} stopped (${signal})`)
      return
    }

    if (code && code !== 0) {
      console.error(`[dev] ${label} exited with code ${code}`)
      shutdown(code ?? 1)
    }
  })

  return child
}

const children = []
let isShuttingDown = false

function shutdown(code = 0) {
  if (isShuttingDown) return
  isShuttingDown = true

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }

  setTimeout(() => process.exit(code), 100)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

await loadEnvFiles()
await buildApiRoutes()

console.log('[dev] starting local API on http://127.0.0.1:3000')
console.log('[dev] starting frontend on http://127.0.0.1:5173')

children.push(spawnProcess('node', ['scripts/dev-api.mjs'], 'api'))
children.push(spawnProcess('npm', ['run', 'dev', '--prefix', 'frontend'], 'frontend'))
