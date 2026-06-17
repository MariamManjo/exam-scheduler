import { getApiUrl } from '../config/env'

export const EXTRACT_BATCH_SIZE = 2

export function apiPath(path: string): string {
  const base = getApiUrl().replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
