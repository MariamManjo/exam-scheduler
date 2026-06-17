import { createId } from '../lib/ids'
import { getApiUrl } from '../config/env'
import type { ExtractedStudent, UploadedImage } from '../types/upload'

export interface ExtractionProgress {
  overallProgress: number
  currentImageIndex: number
  currentImageName: string
  imageProgress: number
}

export class ExtractApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ExtractApiError'
    this.status = status
  }
}

interface ApiExtractedExam {
  subject: string
  date: string | null
  time: string
}

interface ApiExtractedStudent {
  name: string
  exams: ApiExtractedExam[]
}

interface ExtractApiResponse {
  students: ApiExtractedStudent[]
}

function parseErrorMessage(text: string, status: number): string {
  let message = `Request failed with status ${status}`
  if (!text) return message

  try {
    const body = JSON.parse(text) as { detail?: string | Array<{ msg?: string }> }
    if (typeof body.detail === 'string') {
      return body.detail
    }
    if (Array.isArray(body.detail)) {
      return body.detail.map((item) => item.msg).filter(Boolean).join(', ')
    }
  } catch {
    return text
  }

  return message
}

function mapToExtractedStudents(
  apiStudents: ApiExtractedStudent[],
  images: UploadedImage[],
): ExtractedStudent[] {
  return apiStudents.map((student, index) => {
    const sourceImageId = images[index]?.id ?? ''
    return {
      id: createId(),
      name: student.name?.trim() || `Student ${index + 1}`,
      sourceImageId,
      exams: (student.exams ?? []).map((exam) => ({
        id: createId(),
        subject: exam.subject?.trim() ?? '',
        date: exam.date,
        time: exam.time,
        sourceImageId,
      })),
    }
  })
}

export async function extractFromImages(
  images: UploadedImage[],
  onProgress: (progress: ExtractionProgress) => void,
): Promise<ExtractedStudent[]> {
  if (images.length === 0) {
    return []
  }

  const formData = new FormData()
  images.forEach((image) => {
    formData.append('images', image.file, image.file.name)
  })

  onProgress({
    overallProgress: 10,
    currentImageIndex: 1,
    currentImageName: images[0].file.name,
    imageProgress: 0,
  })

  const response = await fetch(`${getApiUrl()}/extract`, {
    method: 'POST',
    body: formData,
  })

  onProgress({
    overallProgress: 80,
    currentImageIndex: images.length,
    currentImageName: images[images.length - 1]?.file.name ?? '',
    imageProgress: 80,
  })

  if (!response.ok) {
    const message = parseErrorMessage(await response.text(), response.status)
    throw new ExtractApiError(message, response.status)
  }

  const data = (await response.json()) as ExtractApiResponse

  onProgress({
    overallProgress: 100,
    currentImageIndex: images.length,
    currentImageName: images[images.length - 1]?.file.name ?? '',
    imageProgress: 100,
  })

  return mapToExtractedStudents(data.students ?? [], images)
}
