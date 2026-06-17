const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82
const MAX_BYTES = 1_400_000

export interface CompressedImagePayload {
  base64: string
  contentType: string
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image for compression.'))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image.'))
          return
        }
        resolve(blob)
      },
      type,
      quality,
    )
  })
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to encode image.'))
    reader.readAsDataURL(blob)
  })
}

async function compressWithQuality(
  file: File,
  quality: number,
): Promise<CompressedImagePayload> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas is not available in this browser.')
  }

  context.drawImage(image, 0, 0, width, height)

  let currentQuality = quality
  let blob = await canvasToBlob(canvas, 'image/jpeg', currentQuality)

  while (blob.size > MAX_BYTES && currentQuality > 0.45) {
    currentQuality -= 0.08
    blob = await canvasToBlob(canvas, 'image/jpeg', currentQuality)
  }

  return {
    base64: await blobToBase64(blob),
    contentType: 'image/jpeg',
  }
}

export async function compressImageForOcr(file: File): Promise<CompressedImagePayload> {
  if (file.type === 'image/jpeg' && file.size <= MAX_BYTES) {
    const dataUrl = await readFileAsDataUrl(file)
    const commaIndex = dataUrl.indexOf(',')
    return {
      base64: commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl,
      contentType: file.type,
    }
  }

  return compressWithQuality(file, JPEG_QUALITY)
}
