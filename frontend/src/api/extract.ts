import { apiPath, EXTRACT_BATCH_SIZE } from '../lib/api'
import { compressImageForOcr } from '../lib/compressImage'
import { createId } from '../lib/ids'
import type { ExtractedStudent, UploadedImage } from '../types/upload'

export interface ExtractionProgress {
  overallProgress: number
  currentImageIndex: number
  currentImageName: string
  imageProgress: number
  batchIndex: number
  totalBatches: number
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
    const body = JSON.parse(text) as {
      error?: string
      detail?: string | Array<{ msg?: string }>
    }
    if (typeof body.error === 'string') return body.error
    if (typeof body.detail === 'string') return body.detail
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
  startIndex: number,
): ExtractedStudent[] {
  return apiStudents.map((student, offset) => {
    const imageIndex = startIndex + offset
    const sourceImageId = images[imageIndex]?.id ?? ''
    return {
      id: createId(),
      name: student.name?.trim() || `Student ${imageIndex + 1}`,
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

  const totalBatches = Math.ceil(images.length / EXTRACT_BATCH_SIZE)
  const extractedStudents: ExtractedStudent[] = []

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
    const startIndex = batchIndex * EXTRACT_BATCH_SIZE
    const batchImages = images.slice(startIndex, startIndex + EXTRACT_BATCH_SIZE)
    const batchStartProgress = Math.round((batchIndex / totalBatches) * 100)
    const batchEndProgress = Math.round(((batchIndex + 1) / totalBatches) * 100)

    onProgress({
      overallProgress: batchStartProgress,
      currentImageIndex: startIndex + 1,
      currentImageName: batchImages[0]?.file.name ?? '',
      imageProgress: 10,
      batchIndex: batchIndex + 1,
      totalBatches,
    })

    const payloadImages = await Promise.all(
      batchImages.map(async (image, offset) => {
        const index = startIndex + offset
        const compressed = await compressImageForOcr(image.file)
        return {
          index,
          data: compressed.base64,
          contentType: compressed.contentType,
          fallbackName: `Student ${index + 1}`,
        }
      }),
    )

    onProgress({
      overallProgress: batchStartProgress + Math.round((batchEndProgress - batchStartProgress) * 0.35),
      currentImageIndex: startIndex + batchImages.length,
      currentImageName: batchImages[batchImages.length - 1]?.file.name ?? '',
      imageProgress: 40,
      batchIndex: batchIndex + 1,
      totalBatches,
    })

    const response = await fetch(apiPath('/api/extract'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ images: payloadImages }),
    })

    onProgress({
      overallProgress: batchStartProgress + Math.round((batchEndProgress - batchStartProgress) * 0.85),
      currentImageIndex: startIndex + batchImages.length,
      currentImageName: batchImages[batchImages.length - 1]?.file.name ?? '',
      imageProgress: 85,
      batchIndex: batchIndex + 1,
      totalBatches,
    })

    if (!response.ok) {
      const message = parseErrorMessage(await response.text(), response.status)
      throw new ExtractApiError(message, response.status)
    }

    const data = (await response.json()) as ExtractApiResponse
    extractedStudents.push(...mapToExtractedStudents(data.students ?? [], images, startIndex))
  }

  onProgress({
    overallProgress: 100,
    currentImageIndex: images.length,
    currentImageName: images[images.length - 1]?.file.name ?? '',
    imageProgress: 100,
    batchIndex: totalBatches,
    totalBatches,
  })

  return extractedStudents
}
