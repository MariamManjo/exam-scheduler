import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildApiRoutes } from './build-api.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(rootDir, 'api')
const verifyDir = path.join(rootDir, '.tmp', 'api-verify')

async function verifyExtractRoute() {
  const module = await import(pathToFileUrl(path.join(outputDir, 'extract.js')))

  if (typeof module.POST !== 'function') {
    throw new Error('extract route does not export POST')
  }

  const emptyResponse = await module.POST(
    new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: [] }),
    }),
  )

  if (emptyResponse.status !== 400) {
    throw new Error(`expected 400 for empty images, received ${emptyResponse.status}`)
  }

  const invalidResponse = await module.POST(
    new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not-json',
    }),
  )

  if (invalidResponse.status !== 400) {
    throw new Error(`expected 400 for invalid JSON, received ${invalidResponse.status}`)
  }

  process.env.OPENAI_API_KEY = ''
  const missingKeyResponse = await module.POST(
    new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: [
          {
            index: 0,
            data: 'aGVsbG8=',
            contentType: 'image/jpeg',
            fallbackName: 'Student 1',
          },
        ],
      }),
    }),
  )

  if (missingKeyResponse.status !== 500) {
    const body = await missingKeyResponse.text()
    throw new Error(
      `expected 500 when OPENAI_API_KEY is missing, received ${missingKeyResponse.status}: ${body}`,
    )
  }

  const missingKeyBody = await missingKeyResponse.json()
  if (!String(missingKeyBody.error).includes('OPENAI_API_KEY')) {
    throw new Error('missing OPENAI_API_KEY error message')
  }
}

async function verifyCalculateRoute() {
  const module = await import(pathToFileUrl(path.join(outputDir, 'calculate.js')))

  if (typeof module.POST !== 'function') {
    throw new Error('calculate route does not export POST')
  }

  const response = await module.POST(
    new Request('http://localhost/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        students: [
          { name: 'Student 1', exams: [{ date: '2026-06-22', time: '15:00' }] },
          { name: 'Student 2', exams: [{ date: '2026-06-23', time: '10:00' }] },
        ],
        start_date: '2026-06-01',
        end_date: '2026-06-30',
      }),
    }),
  )

  if (response.status !== 200) {
    const body = await response.text()
    throw new Error(`calculate route failed with ${response.status}: ${body}`)
  }

  const body = await response.json()
  if (!body.best_windows?.length) {
    throw new Error('calculate route returned no windows')
  }
}

function pathToFileUrl(filePath) {
  return new URL(`file://${filePath}`)
}

async function main() {
  await mkdir(verifyDir, { recursive: true })
  await buildApiRoutes()
  await verifyExtractRoute()
  await verifyCalculateRoute()
  await writeFile(
    path.join(verifyDir, 'verify.ok'),
    `verified at ${new Date().toISOString()}\n`,
    'utf8',
  )
  console.log('API production bundle verification passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
