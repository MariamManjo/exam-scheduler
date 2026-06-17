const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv'])

export function isAcceptedFile(file: File): boolean {
  if (IMAGE_TYPES.has(file.type)) return true

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return EXCEL_EXTENSIONS.has(extension)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileKind(file: File): 'image' | 'excel' | 'other' {
  if (IMAGE_TYPES.has(file.type)) return 'image'
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (EXCEL_EXTENSIONS.has(extension)) return 'excel'
  return 'other'
}
