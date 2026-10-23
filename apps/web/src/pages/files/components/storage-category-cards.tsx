import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  FILE_CATEGORY_CONFIG,
  formatBytes,
  getFileCategory,
  type FileCategoryType,
} from '../file-types'
import type { FileSchema } from '../schema'

export interface StorageCategoryCardsProps {
  files: FileSchema[]
  activeCategory?: string | null
  onSelectCategory?: (category: string | null) => void
  className?: string
}

const DISPLAY_CATEGORIES: FileCategoryType[] = [
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

export function StorageCategoryCards({
  files,
  activeCategory,
  onSelectCategory,
  className,
}: StorageCategoryCardsProps) {
  const { t } = useTranslation()

  // Aggregate file count and total bytes per category
  const stats = useMemo(() => {
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

    let grandTotalBytes = 0

    for (const file of files) {
      const cat = getFileCategory(
        file.mime,
        file.resource_type,
        file.original_name
      )
      const targetCat = resolveDisplayCategory(cat)

      categoryTotals[targetCat].count += 1
      categoryTotals[targetCat].bytes += file.size || 0
      grandTotalBytes += file.size || 0
    }

    return { categoryTotals, grandTotalBytes }
  }, [files])

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5',
        className
      )}
    >
      {DISPLAY_CATEGORIES.map((catKey) => {
        const meta = FILE_CATEGORY_CONFIG[catKey]
        const Icon = meta.icon
        const catStat = stats.categoryTotals[catKey]
        const percent =
          stats.grandTotalBytes > 0
            ? Math.round((catStat.bytes / stats.grandTotalBytes) * 100)
            : 0

        const isSelected = activeCategory === catKey

        return (
          <button
            key={catKey}
            type='button'
            onClick={() => {
              if (!onSelectCategory) return
              onSelectCategory(isSelected ? null : catKey)
            }}
            className={cn(
              'group/card flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200',
              'hover:border-foreground/20 hover:shadow-xs focus-visible:outline-hidden',
              isSelected
                ? 'border-primary bg-primary/5 ring-primary/30 shadow-xs ring-1'
                : 'border-border/70 bg-card/50'
            )}
          >
            <div className='flex items-center justify-between'>
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition-transform group-hover/card:scale-105',
                  meta.bgColor,
                  meta.textColor
                )}
              >
                <Icon className='size-4.5' />
              </div>
              <span className='text-muted-foreground text-[11px] font-medium tabular-nums'>
                {t('files.fileCount', { count: catStat.count })}
              </span>
            </div>

            <div className='mt-3 flex flex-col'>
              <span className='text-foreground text-xs font-semibold tracking-tight'>
                {t(meta.i18nKey, meta.label)}
              </span>
              <div className='text-muted-foreground mt-0.5 flex items-center justify-between text-[11px]'>
                <span className='text-foreground/80 font-medium tabular-nums'>
                  {formatBytes(catStat.bytes)}
                </span>
                {percent > 0 && (
                  <span className='text-[10px] tabular-nums'>{percent}%</span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
