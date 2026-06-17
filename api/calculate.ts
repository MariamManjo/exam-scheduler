import type { VercelRequest, VercelResponse } from '@vercel/node'
import { findBestLectureWindows, type Student } from './_lib/scheduler'

interface CalculateRequestBody {
  students: Student[]
  start_date: string
  end_date: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body as CalculateRequestBody
  const students = body?.students ?? []
  const startDate = body?.start_date?.trim()
  const endDate = body?.end_date?.trim()

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'start_date and end_date are required.' })
  }

  if (startDate > endDate) {
    return res.status(400).json({ error: 'start_date must be on or before end_date.' })
  }

  if (students.length === 0) {
    return res.status(400).json({ error: 'At least one student is required.' })
  }

  try {
    const result = findBestLectureWindows(students, startDate, endDate)
    return res.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Schedule calculation failed.'
    return res.status(400).json({ error: message })
  }
}
