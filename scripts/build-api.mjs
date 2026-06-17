import { build } from 'esbuild'
import { mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = path.join(rootDir, 'server')
const outputDir = path.join(rootDir, 'api')

export async function buildApiRoutes() {
  await mkdir(outputDir, { recursive: true })

  for (const entry of await readdir(outputDir)) {
    if (entry.endsWith('.js') || entry.endsWith('.js.map')) {
      await rm(path.join(outputDir, entry), { force: true })
    }
  }

  const entryPoints = ['extract.ts', 'calculate.ts'].map((file) => path.join(serverDir, file))

  await build({
    entryPoints,
    outdir: outputDir,
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'bundle',
    target: 'node20',
    logLevel: 'info',
  })
}

const thisFile = path.resolve(fileURLToPath(import.meta.url))

if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  buildApiRoutes().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
