import { useRef, useState } from 'react'
import { extractFromImages, ExtractApiError, type ExtractionProgress } from '../../api/extract'
import type { useUploadedImages } from '../../hooks/useUploadedImages'
import type { ExtractedStudent } from '../../types/upload'
import { PageHeader } from '../layout/PageHeader'
import { ImageDropZone } from './ImageDropZone'
import { ImagePreviewGrid } from './ImagePreviewGrid'
import { UploadProgressPanel } from './UploadProgressPanel'
import { ValidationAlert } from './ValidationAlert'

interface ImageUploadPageProps {
  upload: ReturnType<typeof useUploadedImages>
  onComplete: (students: ExtractedStudent[]) => void
}

const INITIAL_PROGRESS: ExtractionProgress = {
  overallProgress: 0,
  currentImageIndex: 0,
  currentImageName: '',
  imageProgress: 0,
}

export function ImageUploadPage({ upload, onComplete }: ImageUploadPageProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ExtractionProgress>(INITIAL_PROGRESS)
  const [processError, setProcessError] = useState<string | null>(null)

  const {
    images,
    validationErrors,
    addImages,
    removeImage,
    reorderImages,
    updateImageProgress,
  } = upload

  const handleProcess = async () => {
    if (images.length === 0 || isProcessing) return

    setIsProcessing(true)
    setProcessError(null)
    setProgress(INITIAL_PROGRESS)

    try {
      images.forEach((image) => updateImageProgress(image.id, 0, 'uploading'))

      const students = await extractFromImages(images, (nextProgress) => {
        setProgress(nextProgress)

        if (nextProgress.overallProgress >= 100) {
          images.forEach((image) => updateImageProgress(image.id, 100, 'complete'))
          return
        }

        const currentImage = images[nextProgress.currentImageIndex - 1]
        if (currentImage) {
          updateImageProgress(currentImage.id, nextProgress.imageProgress, 'uploading')
        }
      })

      images.forEach((image) => updateImageProgress(image.id, 100, 'complete'))
      onComplete(students)
    } catch (err) {
      const message =
        err instanceof ExtractApiError
          ? err.message
          : err instanceof TypeError
            ? 'Unable to reach the OCR server. Make sure the backend is running.'
            : 'Failed to extract exam data from images. Please try again.'
      setProcessError(message)
      images.forEach((image) => updateImageProgress(image.id, 0, 'error'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Step 1"
        title="Upload exam schedules"
        description="Upload Georgian university exam timetable screenshots. Exam data will be extracted automatically for review."
      />

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <ImageDropZone
          imageCount={images.length}
          isDragging={isDragging}
          disabled={isProcessing}
          onBrowse={() => inputRef.current?.click()}
          onDragStateChange={setIsDragging}
          onFilesDropped={(files) => addImages(files)}
        />

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
          className="sr-only"
          disabled={isProcessing}
          onChange={(e) => {
            if (e.target.files) addImages(e.target.files)
            e.target.value = ''
          }}
        />

        <ValidationAlert errors={validationErrors} />

        <ImagePreviewGrid
          images={images}
          onRemove={removeImage}
          onReorder={reorderImages}
        />

        {!isProcessing && (
          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-subtle">
              {images.length === 0
                ? 'Add at least one image to continue.'
                : `${images.length} image${images.length === 1 ? '' : 's'} ready for review`}
            </p>
            <button
              type="button"
              disabled={images.length === 0}
              onClick={handleProcess}
              className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upload & Review
            </button>
          </div>
        )}
      </section>

      {isProcessing && <div className="mt-6"><UploadProgressPanel progress={progress} /></div>}

      {processError && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {processError}
        </p>
      )}
    </div>
  )
}
