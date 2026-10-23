import { useMemo, useState } from 'react'
import {
  Clock,
  Folder,
  FolderPlus,
  HardDrive,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  FILE_CATEGORY_CONFIG,
  formatBytes,
  getFolderColor,
} from '../file-types'
import { type FolderSchema } from '../schema'

export type FileViewType = 'all' | 'starred' | 'recent' | 'trash'

export interface FilesSubSidebarProps {
  view: FileViewType
  onViewChange: (view: FileViewType) => void
  folders: FolderSchema[]
  activeFolder: string | null
  totalFiles: number
  starredCount: number
  trashCount?: number
  onSelectFolder: (folder: string | null) => void
  onUploadClick: () => void
  onCreateFolderClick: () => void
  onRenameFolder: (folder: string) => void
  onDeleteFolder: (folder: string) => void
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  className?: string
}

export function FilesSubSidebar({
  view,
  onViewChange,
  folders,
  activeFolder,
  totalFiles,
  starredCount,
  trashCount,
  onSelectFolder,
  onUploadClick,
  onCreateFolderClick,
  onRenameFolder,
  onDeleteFolder,
  canCreate,
  canUpdate,
  canDelete,
  className,
}: FilesSubSidebarProps) {
  const { t } = useTranslation()
  const [folderSearch, setFolderSearch] = useState('')

  // Storage calculation
  const totalStorageBytes = useMemo(
    () => folders.reduce((sum, f) => sum + f.size, 0),
    [folders]
  )
  const quotaBytes = 15 * 1024 * 1024 * 1024 // 15 GB quota reference
  const storagePercent = Math.min(
    100,
    Math.round((totalStorageBytes / quotaBytes) * 100)
  )

  const filteredFolders = useMemo(() => {
    if (!folderSearch.trim()) return folders
    const q = folderSearch.toLowerCase()
    return folders.filter((f) => f.folder.toLowerCase().includes(q))
  }, [folders, folderSearch])

  return (
    <aside
      className={cn(
        'border-border bg-card/60 flex h-fit flex-col gap-4 rounded-xl border p-3.5 shadow-xs',
        className
      )}
    >
      {/* "+ New" Action Button with Dropdown */}
      {canCreate && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className='h-9 w-full gap-2 rounded-lg font-medium shadow-xs'>
              <Plus className='size-4' />
              <span>{t('files.actions.new', 'New')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-48'>
            <DropdownMenuItem onClick={onUploadClick} className='gap-2.5'>
              <Upload className='size-4 text-violet-500' />
              <span>{t('files.actions.upload', 'Upload file')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateFolderClick} className='gap-2.5'>
              <FolderPlus className='size-4 text-amber-500' />
              <span>{t('files.actions.createFolder', 'New folder')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Primary Navigation Views */}
      <div className='flex flex-col gap-0.5'>
        {/* All Files */}
        <Button
          variant={
            view === 'all' && activeFolder === null ? 'secondary' : 'ghost'
          }
          size='sm'
          className={cn(
            'h-8.5 justify-start gap-2.5 px-2.5 text-xs font-medium',
            view === 'all' &&
              activeFolder === null &&
              'text-primary font-semibold'
          )}
          onClick={() => onViewChange('all')}
        >
          <HardDrive className='size-4' />
          <span className='min-w-0 flex-1 truncate text-left'>
            {t('files.nav.allFiles', 'All Files')}
          </span>
          <span className='text-muted-foreground text-[11px] font-normal tabular-nums'>
            {totalFiles}
          </span>
        </Button>

        {/* Starred */}
        <Button
          variant={view === 'starred' ? 'secondary' : 'ghost'}
          size='sm'
          className={cn(
            'h-8.5 justify-start gap-2.5 px-2.5 text-xs font-medium',
            view === 'starred' &&
              'font-semibold text-amber-500 dark:text-amber-400'
          )}
          onClick={() => onViewChange('starred')}
        >
          <Star
            className={cn(
              'size-4',
              starredCount > 0 && 'fill-amber-400 text-amber-500'
            )}
          />
          <span className='min-w-0 flex-1 truncate text-left'>
            {t('files.nav.starred', 'Starred')}
          </span>
          {starredCount > 0 && (
            <Badge
              variant='secondary'
              className='h-5 px-1.5 py-0 text-[10px] font-medium'
            >
              {starredCount}
            </Badge>
          )}
        </Button>

        {/* Recent */}
        <Button
          variant={view === 'recent' ? 'secondary' : 'ghost'}
          size='sm'
          className={cn(
            'h-8.5 justify-start gap-2.5 px-2.5 text-xs font-medium',
            view === 'recent' && 'text-primary font-semibold'
          )}
          onClick={() => onViewChange('recent')}
        >
          <Clock className='size-4' />
          <span className='min-w-0 flex-1 truncate text-left'>
            {t('files.nav.recent', 'Recent')}
          </span>
        </Button>

        {/* Trash */}
        <Button
          variant={view === 'trash' ? 'secondary' : 'ghost'}
          size='sm'
          className={cn(
            'h-8.5 justify-start gap-2.5 px-2.5 text-xs font-medium',
            view === 'trash' && 'text-destructive font-semibold'
          )}
          onClick={() => onViewChange('trash')}
        >
          <Trash2 className='size-4' />
          <span className='min-w-0 flex-1 truncate text-left'>
            {t('files.nav.trash', 'Trash')}
          </span>
          {typeof trashCount === 'number' && trashCount > 0 && (
            <Badge
              variant='secondary'
              className='text-destructive h-5 px-1.5 py-0 text-[10px] font-medium'
            >
              {trashCount}
            </Badge>
          )}
        </Button>
      </div>

      <Separator />

      {/* Folders Section */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between px-1'>
          <span className='text-muted-foreground text-[11px] font-semibold tracking-wider uppercase'>
            {t('files.folders.title', 'Folders')}
          </span>
          <div className='flex items-center gap-1'>
            <Badge
              variant='secondary'
              className='h-4.5 px-1.5 py-0 text-[10px]'
            >
              {folders.length}
            </Badge>
            {canCreate && (
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground size-5.5'
                onClick={onCreateFolderClick}
                title={t('files.actions.createFolder', 'Create folder')}
                aria-label={t('files.actions.createFolder', 'Create folder')}
              >
                <Plus className='size-3.5' />
              </Button>
            )}
          </div>
        </div>

        {/* Search folders if > 3 */}
        {folders.length > 3 && (
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-2 left-2 size-3' />
            <Input
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
              placeholder={t(
                'files.folders.filterPlaceholder',
                'Filter folders...'
              )}
              className='h-7 pl-7 text-xs'
            />
          </div>
        )}

        {/* Folder list */}
        <div className='flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-0.5'>
          {filteredFolders.length === 0 ? (
            <p className='text-muted-foreground py-2 text-center text-xs'>
              {t('files.folders.empty', 'No folders')}
            </p>
          ) : (
            filteredFolders.map((folder) => {
              const depth = folder.depth ?? folder.folder.split('/').length - 1
              const displayName =
                folder.name ?? folder.folder.split('/').pop() ?? folder.folder
              const color = getFolderColor(folder.color)
              const isSelected = activeFolder === folder.folder

              return (
                <div
                  key={folder.folder}
                  className={cn(
                    'group/item flex h-8 items-center justify-between rounded-md px-2 text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-secondary text-primary font-semibold'
                      : 'hover:bg-accent/60 text-foreground'
                  )}
                  style={{ paddingLeft: `${8 + depth * 10}px` }}
                >
                  <button
                    type='button'
                    className='flex min-w-0 flex-1 items-center gap-2 text-left'
                    onClick={() => {
                      onViewChange('all')
                      onSelectFolder(folder.folder)
                    }}
                  >
                    <Folder
                      className={cn('size-3.5 shrink-0', color.text)}
                      fill='currentColor'
                      fillOpacity={0.2}
                    />
                    <span className='min-w-0 flex-1 truncate'>
                      {displayName}
                    </span>
                  </button>

                  <div className='flex items-center gap-1'>
                    <span className='text-muted-foreground text-[10px] tabular-nums'>
                      {folder.count}
                    </span>

                    {(canUpdate || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-5 opacity-0 transition-opacity group-hover/item:opacity-100'
                            aria-label={t(
                              'files.folders.actions',
                              'Folder actions'
                            )}
                          >
                            <MoreVertical className='size-3' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-32'>
                          {canUpdate && (
                            <DropdownMenuItem
                              onClick={() => onRenameFolder(folder.folder)}
                              className='gap-2 text-xs'
                            >
                              <Pencil className='size-3' />
                              <span>{t('buttons.rename', 'Rename')}</span>
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => onDeleteFolder(folder.folder)}
                              className='text-destructive gap-2 text-xs'
                            >
                              <Trash2 className='size-3' />
                              <span>{t('buttons.delete', 'Delete')}</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <Separator />

      {/* Mini Storage Widget at bottom */}
      <div className='flex flex-col gap-2 px-1'>
        <div className='flex items-center justify-between text-[11px]'>
          <span className='text-muted-foreground font-semibold'>
            {t('files.storage.title', 'Storage')}
          </span>
          <span className='text-muted-foreground font-medium tabular-nums'>
            {formatBytes(totalStorageBytes)} / 15 GB
          </span>
        </div>

        {/* Multi-category colored bar representation */}
        <div className='bg-muted/80 flex h-2 w-full overflow-hidden rounded-full'>
          <div
            className='h-full bg-violet-500 transition-[width] duration-200 ease-out'
            style={{ width: `${Math.max(storagePercent * 0.4, 2)}%` }}
            title={t(
              FILE_CATEGORY_CONFIG.image.i18nKey,
              FILE_CATEGORY_CONFIG.image.label
            )}
          />
          <div
            className='h-full bg-pink-500 transition-[width] duration-200 ease-out'
            style={{ width: `${Math.max(storagePercent * 0.25, 1)}%` }}
            title={t(
              FILE_CATEGORY_CONFIG.video.i18nKey,
              FILE_CATEGORY_CONFIG.video.label
            )}
          />
          <div
            className='h-full bg-amber-500 transition-[width] duration-200 ease-out'
            style={{ width: `${Math.max(storagePercent * 0.2, 1)}%` }}
            title={t(
              FILE_CATEGORY_CONFIG.document.i18nKey,
              FILE_CATEGORY_CONFIG.document.label
            )}
          />
          <div
            className='h-full bg-emerald-500 transition-[width] duration-200 ease-out'
            style={{ width: `${Math.max(storagePercent * 0.15, 1)}%` }}
            title={t(
              FILE_CATEGORY_CONFIG.archive.i18nKey,
              FILE_CATEGORY_CONFIG.archive.label
            )}
          />
        </div>

        {/* Legend dots */}
        <div className='text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px]'>
          <span className='flex items-center gap-1'>
            <span className='size-1.5 rounded-full bg-violet-500' />
            {t(
              FILE_CATEGORY_CONFIG.image.i18nKey,
              FILE_CATEGORY_CONFIG.image.label
            )}
          </span>
          <span className='flex items-center gap-1'>
            <span className='size-1.5 rounded-full bg-pink-500' />
            {t(
              FILE_CATEGORY_CONFIG.video.i18nKey,
              FILE_CATEGORY_CONFIG.video.label
            )}
          </span>
          <span className='flex items-center gap-1'>
            <span className='size-1.5 rounded-full bg-amber-500' />
            {t(
              FILE_CATEGORY_CONFIG.document.i18nKey,
              FILE_CATEGORY_CONFIG.document.label
            )}
          </span>
        </div>
      </div>
    </aside>
  )
}
