import { useMemo } from 'react'
import { HardDrive } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  FILE_CATEGORY_CONFIG,
  formatBytes,
  getFileCategory,
  type FileCategoryType,
} from '../file-types'
import type { FileSchema, FolderSchema } from '../schema'

export interface StorageOverviewWidgetProps {
  files?: FileSchema[]
  folders?: FolderSchema[]
  quotaBytes?: number // default 15 GB
  className?: string
}

const CATEGORY_KEYS: FileCategoryType[] = [
  'image',
  'video',
  'document',
  'archive',
  'other',
]

function resolveDisplayCategory(cat: FileCategoryType): FileCategoryType {
  if (cat === 'code') return 'document'
  if (cat === 'audio') return 'other'
  return cat
}

export function StorageOverviewWidget({
  files = [],
  folders = [],
  quotaBytes = 15 * 1024 * 1024 * 1024, // 15 GB
  className,
}: StorageOverviewWidgetProps) {
  const { t } = useTranslation()

  const { breakdown, usedBytes, usedPercent } = useMemo(() => {
    const categoryTotals: Record<
      FileCategoryType,
      { count: number; bytes: number }
    > = {
      image: { count: 0, bytes: 0 },
      video: { count: 0, bytes: 0 },
      document: { count: 0, bytes: 0 },
      archive: { count: 0, bytes: 0 },
      audio: { count: 0, bytes: 0 },
      code: { count: 0, bytes: 0 },
      other: { count: 0, bytes: 0 },
    }

    let filesBytes = 0
    for (const f of files) {
      const cat = getFileCategory(f.mime, f.resource_type, f.original_name)
      const targetCat = resolveDisplayCategory(cat)

      categoryTotals[targetCat].count += 1
      categoryTotals[targetCat].bytes += f.size || 0
      filesBytes += f.size || 0
    }

    // If no files are loaded yet, fall back to folder sizes
    const foldersBytes = folders.reduce((sum, f) => sum + f.size, 0)
    const used = Math.max(filesBytes, foldersBytes)
    const percent = Math.min(100, Math.round((used / quotaBytes) * 100))

    return {
      breakdown: categoryTotals,
      usedBytes: used,
      usedPercent: percent,
    }
  }, [files, folders, quotaBytes])

  return (
    <div
      className={cn(
        'border-border/60 bg-card/40 flex flex-col gap-3 rounded-xl border p-4 shadow-xs',
        className
      )}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md'>
            <HardDrive className='size-4' />
          </div>
          <span className='text-xs font-semibold tracking-tight'>
            {t('files.storage.title', 'Storage Overview')}
          </span>
        </div>
        <span className='text-muted-foreground text-xs font-semibold tabular-nums'>
          {usedPercent}%
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div className='bg-muted/80 flex h-2.5 w-full overflow-hidden rounded-full p-0.5'>
        {CATEGORY_KEYS.map((catKey) => {
          const cat = breakdown[catKey]
          const catPercent = usedBytes > 0 ? (cat.bytes / usedBytes) * 100 : 0
          if (catPercent <= 0) return null

          const meta = FILE_CATEGORY_CONFIG[catKey]
          const catLabel = t(meta.i18nKey, meta.label)

          return (
            <div
              key={catKey}
              className={cn('h-full first:rounded-l-full last:rounded-r-full')}
              style={{
                width: `${Math.max(catPercent, 2)}%`,
                backgroundColor: meta.color,
              }}
              title={`${catLabel}: ${formatBytes(cat.bytes)} (${Math.round(catPercent)}%)`}
            />
          )
        })}
      </div>

      <div className='flex items-center justify-between text-[11px]'>
        <span className='text-muted-foreground'>
          {t('files.storage.usedOf', {
            used: formatBytes(usedBytes),
            total: formatBytes(quotaBytes),
            defaultValue: `${formatBytes(usedBytes)} of ${formatBytes(quotaBytes)} used`,
          })}
        </span>
      </div>

      {/* Category breakdown dots */}
      <div className='border-border/40 mt-1 grid grid-cols-2 gap-x-2 gap-y-1.5 border-t pt-2.5 text-xs'>
        {CATEGORY_KEYS.map((catKey) => {
          const meta = FILE_CATEGORY_CONFIG[catKey]
          const cat = breakdown[catKey]

          return (
            <div
              key={catKey}
              className='flex items-center justify-between gap-1'
            >
              <div className='flex min-w-0 items-center gap-1.5'>
                <span
                  className='size-2 shrink-0 rounded-full'
                  style={{ backgroundColor: meta.color }}
                />
                <span className='text-muted-foreground truncate text-[11px]'>
                  {t(meta.i18nKey, meta.label)}
                </span>
              </div>
              <span className='text-foreground/80 shrink-0 text-[11px] font-medium tabular-nums'>
                {formatBytes(cat.bytes)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
