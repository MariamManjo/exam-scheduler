import { useCallback, useEffect, useRef, useState } from 'react'
import { createId } from '../lib/ids'
import { validateImages, MAX_IMAGES } from '../lib/imageValidation'
import type { UploadedImage } from '../types/upload'

function createUploadedImage(file: File): UploadedImage {
  return {
    id: createId(),
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'pending',
    progress: 0,
  }
}

export function useUploadedImages() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const imagesRef = useRef(images)
  imagesRef.current = images

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  const addImages = useCallback(
    (incoming: FileList | File[]) => {
      const { valid, errors } = validateImages(Array.from(incoming), images.length)
      const existingKeys = new Set(
        images.map((image) => `${image.file.name}-${image.file.size}-${image.file.lastModified}`),
      )

      const newImages = valid
        .filter(
          (file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`),
        )
        .map(createUploadedImage)

      if (newImages.length > 0) {
        setImages((current) => [...current, ...newImages].slice(0, MAX_IMAGES))
      }

      setValidationErrors(errors)
    },
    [images],
  )

  const removeImage = useCallback((id: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return current.filter((image) => image.id !== id)
    })
    setValidationErrors([])
  }, [])

  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    setImages((current) => {
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const clearImages = useCallback(() => {
    setImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
      return []
    })
    setValidationErrors([])
  }, [])

  const updateImageProgress = useCallback((id: string, progress: number, status?: UploadedImage['status']) => {
    setImages((current) =>
      current.map((image) =>
        image.id === id
          ? { ...image, progress, status: status ?? image.status }
          : image,
      ),
    )
  }, [])

  return {
    images,
    validationErrors,
    addImages,
    removeImage,
    reorderImages,
    clearImages,
    updateImageProgress,
    setValidationErrors,
  }
}
