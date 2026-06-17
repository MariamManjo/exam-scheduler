import { formatFileSize } from './files'

export const MAX_IMAGES = 50
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

export interface ImageValidationResult {
  valid: File[]
  errors: string[]
}

export function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) return true
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'].includes(extension)
}

export function validateImages(
  incoming: File[],
  existingCount: number,
): ImageValidationResult {
  const valid: File[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  if (existingCount >= MAX_IMAGES) {
    return { valid: [], errors: [`Maximum of ${MAX_IMAGES} images allowed.`] }
  }

  let remainingSlots = MAX_IMAGES - existingCount

  for (const file of incoming) {
    if (remainingSlots <= 0) {
      errors.push(`Only ${MAX_IMAGES} images can be uploaded. Extra files were skipped.`)
      break
    }

    const key = `${file.name}-${file.size}-${file.lastModified}`
    if (seen.has(key)) continue
    seen.add(key)

    if (!isAcceptedImage(file)) {
      errors.push(`"${file.name}" is not a supported image format.`)
      continue
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      errors.push(
        `"${file.name}" exceeds the ${formatFileSize(MAX_IMAGE_SIZE_BYTES)} size limit.`,
      )
      continue
    }

    if (file.size === 0) {
      errors.push(`"${file.name}" is empty.`)
      continue
    }

    valid.push(file)
    remainingSlots -= 1
  }

  return { valid, errors }
}
