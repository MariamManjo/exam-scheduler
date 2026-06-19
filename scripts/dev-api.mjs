import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFiles } from './load-env.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PORT ?? 3000)

const routes = {
  '/api/extract': () => import(pathToFileUrl(path.join(rootDir, 'api', 'extract.js'))),
  '/api/calculate': () => import(pathToFileUrl(path.join(rootDir, 'api', 'calculate.js'))),
}

function pathToFileUrl(filePath) {
  return new URL(`file://${filePath}`)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function writeCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
}

const server = http.createServer(async (req, res) => {
  writeCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const requestUrl = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
  const loadRoute = routes[requestUrl.pathname]

  if (!loadRoute || req.method !== 'POST') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  try {
    const routeModule = await loadRoute()
    const handler = routeModule.POST

    if (typeof handler !== 'function') {
      throw new Error(`${requestUrl.pathname} does not export POST`)
    }

    const body = await readBody(req)
    const request = new Request(`${requestUrl.origin}${requestUrl.pathname}${requestUrl.search}`, {
      method: req.method,
      headers: req.headers,
      body: body.length > 0 ? body : undefined,
    })

    const response = await handler(request)
    const responseBody = Buffer.from(await response.arrayBuffer())
    const headers = Object.fromEntries(response.headers.entries())

    res.writeHead(response.status, headers)
    res.end(responseBody)
  } catch (error) {
    console.error(`[dev-api] ${requestUrl.pathname} failed:`, error)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
})

await loadEnvFiles()

server.listen(port, '127.0.0.1', () => {
  console.log(`[dev-api] listening on http://127.0.0.1:${port}`)
})
