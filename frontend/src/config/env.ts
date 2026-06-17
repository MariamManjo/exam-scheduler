const DEFAULT_API_URL = 'http://localhost:8000'

export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL?.trim()
  return url || DEFAULT_API_URL
}
