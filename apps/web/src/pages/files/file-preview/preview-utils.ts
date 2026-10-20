import type { FileSchema } from '../schema'

export const imageExtensions = [
  'avif',
  'bmp',
  'gif',
  'ico',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
]

export const videoExtensions = [
  'm4v',
  'mov',
  'mp4',
  'mpeg',
  'ogv',
  'webm',
  'mkv',
  'avi',
]

export const audioExtensions = [
  'mp3',
  'wav',
  'ogg',
  'm4a',
  'flac',
  'aac',
  'weba',
]

export const textExtensions = [
  'txt',
  'md',
  'markdown',
  'json',
  'csv',
  'tsv',
  'xml',
  'html',
  'htm',
  'css',
  'js',
  'ts',
  'jsx',
  'tsx',
  'sql',
  'log',
  'env',
  'yml',
  'yaml',
  'sh',
  'bash',
  'ini',
  'conf',
  'py',
  'java',
  'c',
  'cpp',
  'go',
  'rs',
  'php',
]

export function getFileExtension(value: string): string {
  return value.split('?')[0]?.split('.').pop()?.toLowerCase() ?? ''
}

export function isPreviewableImage(file: FileSchema): boolean {
  const ext = getFileExtension(file.original_name || file.url)
  return (
    file.resource_type === 'image' ||
    file.mime.startsWith('image/') ||
    imageExtensions.includes(ext)
  )
}

export function isPreviewableVideo(file: FileSchema): boolean {
  const ext = getFileExtension(file.original_name || file.url)
  return (
    file.resource_type === 'video' ||
    file.mime.startsWith('video/') ||
    videoExtensions.includes(ext)
  )
}

export function isPreviewableAudio(file: FileSchema): boolean {
  const ext = getFileExtension(file.original_name || file.url)
  return (
    file.resource_type === 'audio' ||
    file.mime.startsWith('audio/') ||
    audioExtensions.includes(ext)
  )
}

export function isTextDocument(file: FileSchema, ext?: string): boolean {
  const fileExt =
    ext ?? getFileExtension(file.original_name || file.url).toLowerCase()
  return (
    textExtensions.includes(fileExt) ||
    file.mime.startsWith('text/') ||
    file.mime === 'application/json' ||
    file.mime === 'application/xml' ||
    file.mime === 'application/javascript'
  )
}

export function isDocxDocument(file: FileSchema, ext?: string): boolean {
  const fileExt =
    ext ?? getFileExtension(file.original_name || file.url).toLowerCase()
  return (
    fileExt === 'docx' ||
    file.mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
}

export function isPdfDocument(file: FileSchema, ext?: string): boolean {
  const fileExt =
    ext ?? getFileExtension(file.original_name || file.url).toLowerCase()
  return fileExt === 'pdf' || file.mime === 'application/pdf'
}

export function getImageThumbnailUrl(
  file: FileSchema,
  transformations = 'w_360,h_225,c_fill,q_75'
): string {
  if (file.resource_type !== 'image') return file.url

  const ext = getFileExtension(file.original_name || file.url).toLowerCase()
  if (['svg', 'gif', 'ico'].includes(ext)) {
    return file.url
  }

  const targetPrefix = `/storage/uploads/${file.resource_type}/`
  if (file.url.includes(targetPrefix)) {
    return file.url.replace(targetPrefix, `${targetPrefix}${transformations}/`)
  }

  return file.url
}
