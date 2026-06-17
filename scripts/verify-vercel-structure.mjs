import { access, readdir, readFile, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiDir = path.join(rootDir, 'api')
const frontendDist = path.join(rootDir, 'frontend', 'dist')
const vercelConfigPath = path.join(rootDir, 'vercel.json')

const pythonMarkers = [
  'requirements.txt',
  'runtime.txt',
  'Procfile',
  'pyproject.toml',
  'Pipfile',
]

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function assertNoPythonInApi() {
  const entries = await readdir(apiDir, { withFileTypes: true })
  const offenders = []

  for (const entry of entries) {
    if (entry.name.endsWith('.py')) {
      offenders.push(`api/${entry.name}`)
    }
  }

  for (const marker of pythonMarkers) {
    if (await exists(path.join(apiDir, marker))) {
      offenders.push(`api/${marker}`)
    }
  }

  if (offenders.length > 0) {
    throw new Error(`api/ must contain Node routes only, found: ${offenders.join(', ')}`)
  }
}

async function assertVercelConfig() {
  const config = JSON.parse(await readFile(vercelConfigPath, 'utf8'))

  if (Array.isArray(config.builds)) {
    throw new Error('vercel.json must not use legacy builds[]; use buildCommand + outputDirectory instead')
  }

  if (!config.buildCommand?.includes('npm run build')) {
    throw new Error('vercel.json buildCommand must run npm run build')
  }

  if (config.outputDirectory !== 'frontend/dist') {
    throw new Error('vercel.json outputDirectory must be frontend/dist')
  }

  if (!config.functions?.['api/**/*.js']) {
    throw new Error('vercel.json must configure api/**/*.js serverless functions')
  }
}

async function cleanBuildArtifacts() {
  for (const file of ['extract.js', 'calculate.js', 'extract.js.map', 'calculate.js.map']) {
    await rm(path.join(apiDir, file), { force: true })
  }
  await rm(frontendDist, { recursive: true, force: true })
}

async function assertBuiltArtifacts() {
  for (const route of ['extract.js', 'calculate.js']) {
    const routePath = path.join(apiDir, route)
    if (!(await exists(routePath))) {
      throw new Error(`missing built API route: api/${route}`)
    }

    const routeStat = await stat(routePath)
    if (routeStat.size < 100) {
      throw new Error(`api/${route} looks too small (${routeStat.size} bytes)`)
    }
  }

  if (!(await exists(path.join(frontendDist, 'index.html')))) {
    throw new Error('missing frontend build output at frontend/dist/index.html')
  }
}

async function main() {
  console.log('Checking Vercel project structure...')
  await assertVercelConfig()
  await assertNoPythonInApi()

  console.log('Simulating clean Vercel clone (no prebuilt api/*.js or frontend/dist)...')
  await cleanBuildArtifacts()

  console.log('Running production build...')
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' })

  await assertBuiltArtifacts()
  console.log('Vercel deployment structure verification passed')
  console.log('- Frontend static output: frontend/dist')
  console.log('- API routes (Node.js): api/extract.js, api/calculate.js')
  console.log('- TypeScript API source stays in server/ (not scanned as Python)')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
