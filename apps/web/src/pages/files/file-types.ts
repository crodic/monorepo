import i18n from '@/i18n'
import {
  Archive,
  Code2,
  File,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  type LucideIcon,
} from 'lucide-react'

export type FileCategoryType =
  'image' | 'video' | 'document' | 'archive' | 'audio' | 'code' | 'other'

export interface FileTypeMeta {
  type: FileCategoryType
  label: string
  icon: LucideIcon
  color: string // hex for charts/progress
  textColor: string // tailwind text
  bgColor: string // tailwind bg with opacity
  borderColor: string // tailwind border
}

export const FILE_CATEGORY_CONFIG: Record<FileCategoryType, FileTypeMeta> = {
  image: {
    type: 'image',
    label: i18n.t('files.categories.image', 'Images'),
    icon: ImageIcon,
    color: '#8B5CF6',
    textColor: 'text-violet-500 dark:text-violet-400',
    bgColor: 'bg-violet-500/10 dark:bg-violet-500/20',
    borderColor: 'border-violet-500/20',
  },
  video: {
    type: 'video',
    label: i18n.t('files.categories.video', 'Videos'),
    icon: Video,
    color: '#EC4899',
    textColor: 'text-pink-500 dark:text-pink-400',
    bgColor: 'bg-pink-500/10 dark:bg-pink-500/20',
    borderColor: 'border-pink-500/20',
  },
  document: {
    type: 'document',
    label: i18n.t('files.categories.document', 'Documents'),
    icon: FileText,
    color: '#F59E0B',
    textColor: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    borderColor: 'border-amber-500/20',
  },
  archive: {
    type: 'archive',
    label: i18n.t('files.categories.archive', 'Archives'),
    icon: Archive,
    color: '#10B981',
    textColor: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-500/20',
  },
  audio: {
    type: 'audio',
    label: i18n.t('files.categories.audio', 'Audio'),
    icon: Music,
    color: '#06B6D4',
    textColor: 'text-cyan-500 dark:text-cyan-400',
    bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    borderColor: 'border-cyan-500/20',
  },
  code: {
    type: 'code',
    label: i18n.t('files.categories.code', 'Code'),
    icon: Code2,
    color: '#6366F1',
    textColor: 'text-indigo-500 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    borderColor: 'border-indigo-500/20',
  },
  other: {
    type: 'other',
    label: i18n.t('files.categories.other', 'Other'),
    icon: File,
    color: '#64748B',
    textColor: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-500/10 dark:bg-slate-500/20',
    borderColor: 'border-slate-500/20',
  },
}

/**
 * Determines FileCategoryType from MIME type and optional resource_type.
 */
export function getFileCategory(
  mime?: string | null,
  resourceType?: string | null,
  fileName?: string | null
): FileCategoryType {
  const m = (mime || '').toLowerCase()
  const rt = (resourceType || '').toLowerCase()
  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : ''

  if (rt === 'image' || m.startsWith('image/')) return 'image'
  if (rt === 'video' || m.startsWith('video/')) return 'video'
  if (rt === 'audio' || m.startsWith('audio/')) return 'audio'

  // Code extensions and MIME
  const codeExtensions = [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'html',
    'css',
    'scss',
    'py',
    'rb',
    'go',
    'rs',
    'java',
    'c',
    'cpp',
    'php',
    'sql',
    'sh',
    'yaml',
    'yml',
    'xml',
  ]
  if (
    codeExtensions.includes(ext || '') ||
    m.includes('javascript') ||
    m.includes('typescript') ||
    m.includes('json') ||
    m.includes('xml')
  ) {
    return 'code'
  }

  // Archives
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
  if (
    archiveExtensions.includes(ext || '') ||
    m.includes('zip') ||
    m.includes('compressed') ||
    m.includes('tar')
  ) {
    return 'archive'
  }

  // Documents
  const docExtensions = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'md',
    'csv',
  ]
  if (
    docExtensions.includes(ext || '') ||
    m.includes('pdf') ||
    m.includes('word') ||
    m.includes('excel') ||
    m.includes('powerpoint') ||
    m.includes('text/')
  ) {
    return 'document'
  }

  return 'other'
}

/**
 * Palette of vibrant colors for folders.
 */
export const FOLDER_COLOR_PALETTE = [
  {
    hex: '#8B5CF6',
    text: 'text-violet-500',
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
  },
  {
    hex: '#EC4899',
    text: 'text-pink-500',
    bg: 'bg-pink-500/10 dark:bg-pink-500/20',
  },
  {
    hex: '#F59E0B',
    text: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
  },
  {
    hex: '#10B981',
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  },
  {
    hex: '#06B6D4',
    text: 'text-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
  },
  {
    hex: '#3B82F6',
    text: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
  },
  {
    hex: '#F43F5E',
    text: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
  },
  {
    hex: '#6366F1',
    text: 'text-indigo-500',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
  },
]

/**
 * Returns a folder color object. If customColor is provided (from DB), matches it;
 * otherwise falls back to a deterministic color from the palette.
 */
export function getFolderColor(
  folderName?: string | null,
  customColor?: string | null
) {
  if (customColor) {
    const matched = FOLDER_COLOR_PALETTE.find(
      (c) => c.hex.toLowerCase() === customColor.toLowerCase()
    )
    if (matched) return matched
    return {
      hex: customColor,
      text: 'text-violet-500',
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    }
  }

  if (!folderName) return FOLDER_COLOR_PALETTE[0]
  let hash = 0
  for (let i = 0; i < folderName.length; i++) {
    hash = folderName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % FOLDER_COLOR_PALETTE.length
  return FOLDER_COLOR_PALETTE[index]
}

/**
 * Format bytes to readable string (e.g. 1.2 MB, 350 KB, 1.5 GB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
