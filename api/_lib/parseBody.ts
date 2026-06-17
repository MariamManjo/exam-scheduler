export async function parseJsonBody<T>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error('Request body must be application/json.')
  }

  try {
    return (await request.json()) as T
  } catch {
    throw new Error('Invalid JSON request body.')
  }
}
