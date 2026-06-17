import { getApiUrl } from '../config/env'
import type { CalculateScheduleRequest, ScheduleResponse } from '../types/schedule'

export class ScheduleApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ScheduleApiError'
    this.status = status
  }
}

export async function calculateSchedule(
  request: CalculateScheduleRequest,
): Promise<ScheduleResponse> {
  const response = await fetch(`${getApiUrl()}/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    const text = await response.text()

    if (text) {
      try {
        const body = JSON.parse(text) as { detail?: string | Array<{ msg?: string }> }
        if (typeof body.detail === 'string') {
          message = body.detail
        } else if (Array.isArray(body.detail)) {
          message = body.detail.map((item) => item.msg).filter(Boolean).join(', ')
        }
      } catch {
        message = text
      }
    }

    throw new ScheduleApiError(message, response.status)
  }

  return response.json() as Promise<ScheduleResponse>
}
