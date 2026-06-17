import { parseJsonBody } from './_lib/parseBody.js'
import { findBestLectureWindows, type Student } from './_lib/scheduler.js'

interface CalculateRequestBody {
  students: Student[]
  start_date: string
  end_date: string
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody<CalculateRequestBody>(request)
    const students = body.students ?? []
    const startDate = body.start_date?.trim()
    const endDate = body.end_date?.trim()

    if (!startDate || !endDate) {
      return Response.json({ error: 'start_date and end_date are required.' }, { status: 400 })
    }

    if (startDate > endDate) {
      return Response.json(
        { error: 'start_date must be on or before end_date.' },
        { status: 400 },
      )
    }

    if (students.length === 0) {
      return Response.json({ error: 'At least one student is required.' }, { status: 400 })
    }

    const result = findBestLectureWindows(students, startDate, endDate)
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Schedule calculation failed.'

    if (
      message.includes('application/json') ||
      message.includes('Invalid JSON') ||
      message.includes('Request body')
    ) {
      return Response.json({ error: 'Invalid JSON request body.' }, { status: 400 })
    }

    return Response.json({ error: message }, { status: 400 })
  }
}
