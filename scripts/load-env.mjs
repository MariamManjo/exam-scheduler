import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const envFiles = ['.env.local', '.env']

export async function loadEnvFiles() {
  for (const fileName of envFiles) {
    const filePath = path.join(rootDir, fileName)
    let contents = ''

    try {
      contents = await readFile(filePath, 'utf8')
    } catch {
      continue
    }

    for (const line of contents.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) continue

      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
}
