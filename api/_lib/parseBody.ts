import type { VercelRequest } from '@vercel/node'

export function parseJsonBody<T>(req: VercelRequest): T {
  if (req.body == null || req.body === '') {
    throw new Error('Request body is required.')
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T
  }

  return req.body as T
}
