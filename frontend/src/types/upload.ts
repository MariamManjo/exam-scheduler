export type UploadStatus = 'pending' | 'uploading' | 'complete' | 'error'

export interface UploadedImage {
  id: string
  file: File
  previewUrl: string
  status: UploadStatus
  progress: number
  error?: string
}

export interface ExtractedExam {
  id: string
  subject: string
  date: string | null
  time: string
  sourceImageId: string
}

export interface ExtractedStudent {
  id: string
  name: string
  exams: ExtractedExam[]
  sourceImageId: string
}

export interface ExtractionResult {
  students: ExtractedStudent[]
  processedImageCount: number
}

export type AppStep = 'upload' | 'review' | 'schedule' | 'results'
