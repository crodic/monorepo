import { Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatBytes, getFolderColor } from '../file-types'
import type { FolderSchema } from '../schema'

interface FolderCardGridProps {
  folders: FolderSchema[]
  activeFolder: string | null
  onSelectFolder: (folder: string | null) => void
  onRenameFolder?: (folder: string) => void
  onDeleteFolder?: (folder: string) => void
  canUpdate?: boolean
  canDelete?: boolean
  className?: string
}

export function FolderCardGrid({
  folders,
  activeFolder,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  canUpdate,
  canDelete,
  className,
}: FolderCardGridProps) {
  const { t } = useTranslation()

  if (folders.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className='flex items-center justify-between'>
        <h3 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
          {t('files.quickFolders.title', 'Folders')} ({folders.length})
        </h3>
      </div>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5'>
        {folders.map((folder) => {
          const isActive = activeFolder === folder.folder
          const color = getFolderColor(folder.folder, folder.color)
          const displayName =
            folder.name ?? folder.folder.split('/').pop() ?? folder.folder

          return (
            <ContextMenu key={folder.folder}>
              <ContextMenuTrigger asChild>
                <div
                  role='button'
                  tabIndex={0}
                  onClick={() => onSelectFolder(folder.folder)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectFolder(folder.folder)
                    }
                  }}
                  className={cn(
                    'group relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 select-none',
                    'hover:border-foreground/20 hover:bg-accent/40 hover:shadow-xs',
                    isActive
                      ? 'border-primary/60 bg-primary/5 ring-primary/30 shadow-xs ring-1'
                      : 'border-border/70 bg-card/50'
                  )}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
                        color.bg,
                        color.text
                      )}
                    >
                      <Folder className='size-5 fill-current' />
                    </div>

                    {(canUpdate || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-muted-foreground hover:text-foreground size-7 opacity-0 transition-opacity group-hover:opacity-100'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className='size-3.5' />
                            <span className='sr-only'>Folder options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-36'>
                          {canUpdate && onRenameFolder && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onRenameFolder(folder.folder)
                              }}
                              className='gap-2 text-xs'
                            >
                              <Pencil className='size-3.5' />
                              <span>{t('buttons.rename', 'Rename')}</span>
                            </DropdownMenuItem>
                          )}
                          {canDelete && onDeleteFolder && (
                            <DropdownMenuItem
                              variant='destructive'
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteFolder(folder.folder)
                              }}
                              className='gap-2 text-xs'
                            >
                              <Trash2 className='size-3.5' />
                              <span>{t('buttons.delete', 'Delete')}</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className='mt-3 min-w-0'>
                    <p
                      className='text-foreground group-hover:text-primary truncate text-sm font-semibold tracking-tight transition-colors'
                      title={folder.folder}
                    >
                      {displayName}
                    </p>
                    <p className='text-muted-foreground mt-0.5 text-xs font-normal tabular-nums'>
                      {folder.count} files &bull; {formatBytes(folder.size)}
                    </p>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className='w-40'>
                {canUpdate && onRenameFolder && (
                  <ContextMenuItem
                    onClick={() => onRenameFolder(folder.folder)}
                    className='gap-2 text-xs'
                  >
                    <Pencil className='size-3.5' />
                    <span>{t('buttons.rename', 'Rename')}</span>
                  </ContextMenuItem>
                )}
                {canDelete && onDeleteFolder && (
                  <ContextMenuItem
                    variant='destructive'
                    onClick={() => onDeleteFolder(folder.folder)}
                    className='gap-2 text-xs'
                  >
                    <Trash2 className='size-3.5' />
                    <span>{t('buttons.delete', 'Delete')}</span>
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>
    </div>
  )
}
