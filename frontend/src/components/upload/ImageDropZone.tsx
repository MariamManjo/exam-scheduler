import { MAX_IMAGES } from '../../lib/imageValidation'

interface ImageDropZoneProps {
  imageCount: number
  isDragging: boolean
  disabled?: boolean
  onBrowse: () => void
  onDragStateChange: (isDragging: boolean) => void
  onFilesDropped: (files: FileList) => void
}

export function ImageDropZone({
  imageCount,
  isDragging,
  disabled,
  onBrowse,
  onDragStateChange,
  onFilesDropped,
}: ImageDropZoneProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onBrowse()}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onBrowse()
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        if (!disabled) onDragStateChange(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) onDragStateChange(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        onDragStateChange(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDragStateChange(false)
        if (!disabled && e.dataTransfer.files.length > 0) {
          onFilesDropped(e.dataTransfer.files)
        }
      }}
      className={[
        'flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all',
        disabled
          ? 'cursor-not-allowed border-border bg-muted/30 opacity-60'
          : 'cursor-pointer',
        !disabled && isDragging
          ? 'border-accent bg-accent/5 scale-[1.01]'
          : !disabled
            ? 'border-border bg-muted/40 hover:border-accent/40 hover:bg-muted/70'
            : '',
      ].join(' ')}
      aria-label="Upload exam schedule images"
      aria-disabled={disabled}
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-border">
        <svg className="size-8 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
          <path
            d="M21 15l-5.2-5.2a1 1 0 00-1.4 0L12 12.4 9.6 10a1 1 0 00-1.4 0L3 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="text-lg font-medium text-ink">
        Drag & drop images here, or <span className="text-accent">browse files</span>
      </p>
      <p className="mt-2 max-w-md text-sm text-subtle">
        JPG, PNG, WebP, GIF up to 10 MB each. Maximum {MAX_IMAGES} images.
      </p>
      <p className="mt-4 rounded-full bg-surface px-3 py-1 text-xs font-medium text-subtle ring-1 ring-border">
        {imageCount} / {MAX_IMAGES} images
      </p>
    </div>
  )
}
