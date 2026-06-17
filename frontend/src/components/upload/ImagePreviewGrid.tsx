import { useState } from 'react'
import type { UploadedImage } from '../../types/upload'
import { ImagePreviewItem } from './ImagePreviewItem'

interface ImagePreviewGridProps {
  images: UploadedImage[]
  onRemove: (id: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function ImagePreviewGrid({ images, onRemove, onReorder }: ImagePreviewGridProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Image queue</h3>
        <p className="text-xs text-subtle">Drag to reorder processing sequence</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <ImagePreviewItem
            key={image.id}
            image={image}
            index={index}
            isDragging={dragIndex === index}
            onRemove={onRemove}
            onDragStart={setDragIndex}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={() => {
              if (dragIndex !== null && dragIndex !== index) {
                onReorder(dragIndex, index)
                setDragIndex(index)
              }
            }}
            onDrop={() => setDragIndex(null)}
          />
        ))}
      </div>
    </section>
  )
}
