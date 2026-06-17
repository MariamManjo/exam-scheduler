import { getApiUrl } from '../config/env'

// One image per request keeps payloads under Vercel's 4.5 MB body limit.
export const EXTRACT_BATCH_SIZE = 1

export function apiPath(path: string): string {
  const base = getApiUrl().replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
