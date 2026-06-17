import { extractStudentFromImage } from './_lib/ocr.js'
import { parseJsonBody } from './_lib/parseBody.js'

interface ExtractImagePayload {
  index: number
  data: string
  contentType: string
  fallbackName: string
}

interface ExtractRequestBody {
  images: ExtractImagePayload[]
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody<ExtractRequestBody>(request)
    const images = body.images ?? []

    if (images.length === 0) {
      return Response.json({ error: 'At least one image is required.' }, { status: 400 })
    }

    if (images.length > 2) {
      return Response.json({ error: 'Process at most 2 images per request.' }, { status: 400 })
    }

    const students = []

    for (const image of images) {
      if (!image.data || typeof image.index !== 'number') {
        return Response.json(
          { error: 'Each image must include index and data.' },
          { status: 400 },
        )
      }

      const student = await extractStudentFromImage(
        image.data,
        image.contentType || 'image/jpeg',
        image.fallbackName || `Student ${image.index + 1}`,
      )

      students.push({ index: image.index, student })
    }

    students.sort((a, b) => a.index - b.index)

    return Response.json({
      students: students.map((entry) => entry.student),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR extraction failed.'

    if (
      message.includes('application/json') ||
      message.includes('Invalid JSON') ||
      message.includes('Request body')
    ) {
      return Response.json({ error: 'Invalid JSON request body.' }, { status: 400 })
    }

    const status = message.includes('OPENAI_API_KEY') ? 500 : 502
    return Response.json({ error: message }, { status })
  }
}
