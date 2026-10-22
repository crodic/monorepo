import { useEffect } from 'react'
import {
  Clock,
  FolderPlus,
  LayoutGrid,
  List,
  MousePointer,
  PanelRight,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileBreadcrumbs } from './file-breadcrumbs'
import type { FileViewType } from './files-sub-sidebar'

export interface FilesHeaderProps {
  view: FileViewType
  activeFolder: string | null
  onSelectFolder: (folder: string | null) => void
  search: string
  onSearchChange: (search: string) => void
  viewMode: 'grid' | 'table'
  onViewModeChange: (mode: 'grid' | 'table') => void
  onUploadClick: () => void
  onCreateFolderClick: () => void
  onOpenPicker?: () => void
  onToggleInspector?: () => void
  inspectorOpen?: boolean
  totalItems?: number
  isFetching?: boolean
  canCreate?: boolean
}

export function FilesHeader({
  view,
  activeFolder,
  onSelectFolder,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onUploadClick,
  onCreateFolderClick,
  onOpenPicker,
  onToggleInspector,
  inspectorOpen,
  totalItems,
  isFetching,
  canCreate,
}: FilesHeaderProps) {
  const { t } = useTranslation()

  // Keyboard shortcuts (⌘U / Ctrl+U for upload, ⌘N / Ctrl+N for new folder)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
        if (canCreate) {
          e.preventDefault()
          onUploadClick()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canCreate, onUploadClick])

  const getViewTitle = () => {
    switch (view) {
      case 'starred':
        return {
          title: t('files.nav.starred', 'Starred Files'),
          icon: Star,
          color: 'text-amber-500 fill-amber-400',
        }
      case 'recent':
        return {
          title: t('files.nav.recent', 'Recent Files'),
          icon: Clock,
          color: 'text-blue-500',
        }
      case 'trash':
        return {
          title: t('files.nav.trash', 'Trash'),
          icon: Trash2,
          color: 'text-destructive',
        }
      default:
        return null
    }
  }

  const specialView = getViewTitle()

  return (
    <div className='border-border/60 bg-card/40 flex flex-col gap-3 rounded-xl border p-3 shadow-xs'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        {/* Left: Dynamic Breadcrumb or View Title */}
        <div className='flex items-center gap-2'>
          {specialView ? (
            <div className='flex items-center gap-2 px-1'>
              <specialView.icon className={cn('size-4', specialView.color)} />
              <h2 className='text-sm font-semibold tracking-tight'>
                {specialView.title}
              </h2>
              {typeof totalItems === 'number' && (
                <Badge
                  variant='secondary'
                  className='h-5 px-1.5 py-0 text-[11px] font-normal'
                >
                  {isFetching ? '...' : `${totalItems}`}
                </Badge>
              )}
            </div>
          ) : (
            <FileBreadcrumbs
              activeFolder={activeFolder}
              onSelectFolder={onSelectFolder}
              itemCount={totalItems}
              isFetching={isFetching}
            />
          )}
        </div>

        {/* Center / Right: Quick Actions & Controls */}
        <div className='flex flex-1 items-center justify-end gap-2 sm:flex-initial'>
          {/* Search Bar */}
          <div className='relative w-full min-w-40 sm:w-56 lg:w-64'>
            <Search className='text-muted-foreground pointer-events-none absolute top-2 left-2.5 size-3.5' />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('files.search.placeholder', 'Search files...')}
              className='h-8 pr-7 pl-8 text-xs'
            />
            {search && (
              <button
                type='button'
                onClick={() => onSearchChange('')}
                className='text-muted-foreground hover:text-foreground absolute top-2 right-2'
              >
                <X className='size-3.5' />
              </button>
            )}
          </div>

          {/* Quick Actions (Upload & New Folder) */}
          {canCreate && (
            <div className='hidden items-center gap-1.5 md:flex'>
              <Button
                variant='outline'
                size='sm'
                onClick={onCreateFolderClick}
                className='h-8 gap-1.5 px-2.5 text-xs font-medium'
              >
                <FolderPlus className='size-3.5 text-amber-500' />
                <span>{t('files.actions.createFolder', 'New Folder')}</span>
              </Button>
              <Button
                size='sm'
                onClick={onUploadClick}
                className='h-8 gap-1.5 px-2.5 text-xs font-medium'
              >
                <Upload className='size-3.5' />
                <span>{t('files.actions.upload', 'Upload')}</span>
                <kbd className='bg-primary-foreground/20 text-primary-foreground ml-1 hidden h-4 items-center rounded px-1 font-mono text-[10px] leading-none font-medium select-none lg:inline-flex'>
                  ⌘U
                </kbd>
              </Button>
            </div>
          )}

          {/* Demo File Picker Trigger */}
          {onOpenPicker && (
            <Button
              variant='outline'
              size='sm'
              className='h-8 gap-1.5 px-2.5 text-xs font-medium'
              onClick={onOpenPicker}
            >
              <MousePointer className='size-3.5' />
              <span className='hidden sm:inline'>
                {t('files.picker.demoButton')}
              </span>
            </Button>
          )}

          {/* View Mode Toggle (Grid ⊞ / List ☰) */}
          <div className='bg-muted/80 flex items-center rounded-lg p-0.5'>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size='icon'
              className={cn(
                'size-7 rounded-md',
                viewMode === 'grid' && 'bg-background shadow-xs'
              )}
              onClick={() => onViewModeChange('grid')}
              title={t('files.views.grid', 'Grid View')}
            >
              <LayoutGrid className='size-3.5' />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size='icon'
              className={cn(
                'size-7 rounded-md',
                viewMode === 'table' && 'bg-background shadow-xs'
              )}
              onClick={() => onViewModeChange('table')}
              title={t('files.views.list', 'List View')}
            >
              <List className='size-3.5' />
            </Button>
          </div>

          {/* Inspector Toggle Button */}
          {onToggleInspector && (
            <Button
              variant={inspectorOpen ? 'secondary' : 'outline'}
              size='icon'
              className='size-8'
              onClick={onToggleInspector}
              title={t('files.inspector.title', 'Details Panel')}
            >
              <PanelRight className='size-3.5' />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
