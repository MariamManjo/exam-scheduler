import type { VercelRequest, VercelResponse } from '@vercel/node'
import { extractStudentFromImage } from './_lib/ocr'
import { parseJsonBody } from './_lib/parseBody'

interface ExtractImagePayload {
  index: number
  data: string
  contentType: string
  fallbackName: string
}

interface ExtractRequestBody {
  images: ExtractImagePayload[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = parseJsonBody<ExtractRequestBody>(req)
    const images = body.images ?? []

    if (images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' })
    }

    if (images.length > 2) {
      return res.status(400).json({ error: 'Process at most 2 images per request.' })
    }

    const students = []

    for (const image of images) {
      if (!image.data || typeof image.index !== 'number') {
        return res.status(400).json({ error: 'Each image must include index and data.' })
      }

      const student = await extractStudentFromImage(
        image.data,
        image.contentType || 'image/jpeg',
        image.fallbackName || `Student ${image.index + 1}`,
      )

      students.push({ index: image.index, student })
    }

    students.sort((a, b) => a.index - b.index)

    return res.status(200).json({
      students: students.map((entry) => entry.student),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR extraction failed.'
    if (message.includes('Request body is required') || message.includes('JSON')) {
      return res.status(400).json({ error: 'Invalid JSON request body.' })
    }
    const status = message.includes('OPENAI_API_KEY') ? 500 : 502
    return res.status(status).json({ error: message })
  }
}
