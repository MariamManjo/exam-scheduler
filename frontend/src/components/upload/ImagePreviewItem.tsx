import { formatFileSize } from '../../lib/files'
import type { UploadedImage } from '../../types/upload'

interface ImagePreviewItemProps {
  image: UploadedImage
  index: number
  isDragging: boolean
  onRemove: (id: string) => void
  onDragStart: (index: number) => void
  onDragEnd: () => void
  onDragOver: (index: number) => void
  onDrop: (index: number) => void
}

export function ImagePreviewItem({
  image,
  index,
  isDragging,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ImagePreviewItemProps) {
  return (
    <article
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(index)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(index)
      }}
      className={[
        'group relative overflow-hidden rounded-2xl border bg-surface shadow-sm transition-all',
        isDragging ? 'scale-[0.98] border-accent opacity-50' : 'border-border hover:shadow-md',
      ].join(' ')}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image.previewUrl}
          alt={image.file.name}
          className="size-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/50 to-transparent p-3">
          <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {index + 1}
          </span>
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="rounded-lg bg-black/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label={`Remove ${image.file.name}`}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          className="cursor-grab rounded-lg p-1.5 text-subtle transition-colors hover:bg-muted hover:text-ink active:cursor-grabbing"
          aria-label={`Reorder ${image.file.name}`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="9" cy="7" r="1.5" />
            <circle cx="15" cy="7" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="17" r="1.5" />
            <circle cx="15" cy="17" r="1.5" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{image.file.name}</p>
          <p className="text-xs text-subtle">{formatFileSize(image.file.size)}</p>
        </div>
      </div>

      {image.status === 'uploading' && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${image.progress}%` }}
          />
        </div>
      )}
    </article>
  )
}
