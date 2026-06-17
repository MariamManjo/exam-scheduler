import type { ExtractionProgress } from '../../api/extract'

interface UploadProgressPanelProps {
  progress: ExtractionProgress
}

export function UploadProgressPanel({ progress }: UploadProgressPanelProps) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Processing images</h2>
          <p className="mt-1 text-sm text-subtle">
            Extracting exam rows from your images with OpenAI Vision.
          </p>
        </div>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
          {progress.overallProgress}%
        </span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progress.overallProgress}%` }}
        />
      </div>

      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-ink">
          Image {progress.currentImageIndex} · {progress.currentImageName}
        </p>
        <p className="text-subtle">Current file {progress.imageProgress}%</p>
      </div>
    </section>
  )
}
