const DEFAULT_API_URL = ''

export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL?.trim()
  return url ?? DEFAULT_API_URL
}
