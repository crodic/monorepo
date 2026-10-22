import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import i18n from '@/i18n'
import {
  Calendar,
  Copy,
  Download,
  Eye,
  FileIcon,
  Globe,
  Link2,
  Lock,
  MoreHorizontal,
  MoveRight,
  Pencil,
  RotateCcw,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import {
  getFileDiskLabel,
  getFileDiskTooltip,
  isFilePrivate,
} from './disk-helper'
import { downloadFile } from './download-helper'
import { FilePreviewThumbnail } from './file-preview'
import {
  FILE_CATEGORY_CONFIG,
  formatBytes,
  getFileCategory,
} from './file-types'
import { ColumnKey, type FileSchema } from './schema'

export { formatBytes }

export type FileTableColumnOptions = {
  onPreview: (file: FileSchema) => void
  onCopyUrl: (file: FileSchema) => void
  onMove: (file: FileSchema) => void
  onDelete: (file: FileSchema) => void
  onRestore?: (file: FileSchema) => void
  onPermanentDelete?: (file: FileSchema) => void
  onRename?: (file: FileSchema) => void
  onShare?: (file: FileSchema) => void
  isStarred?: (publicId?: string | null) => boolean
  onToggleStar?: (publicId: string) => void
  canUpdate: boolean
  canDelete: boolean
}

export function getFilesTableColumns({
  onPreview,
  onCopyUrl,
  onMove,
  onDelete,
  onRestore,
  onPermanentDelete,
  onRename,
  onShare,
  isStarred,
  onToggleStar,
  canUpdate,
  canDelete,
}: FileTableColumnOptions): ColumnDef<FileSchema>[] {
  const selectionColumn: ColumnDef<FileSchema> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={i18n.t('files.table.selectAll')}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={i18n.t('files.table.selectRow')}
      />
    ),
    size: 36,
    enableColumnFilter: false,
    enableHiding: false,
    enableSorting: false,
  }

  const starColumn: ColumnDef<FileSchema> = {
    id: 'star',
    header: () => null,
    cell: ({ row }) => {
      const file = row.original
      const starred = isStarred?.(file.public_id) ?? false

      return (
        <Button
          variant='ghost'
          size='icon'
          className='size-7'
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar?.(file.public_id)
          }}
          title={
            starred
              ? i18n.t('files.actions.unstar', 'Unstar file')
              : i18n.t('files.actions.star', 'Star file')
          }
        >
          <Star
            className={cn(
              'size-3.5 transition-colors',
              starred
                ? 'fill-amber-400 text-amber-500'
                : 'text-muted-foreground/30 hover:text-amber-500'
            )}
          />
        </Button>
      )
    },
    size: 32,
    enableColumnFilter: false,
    enableHiding: false,
    enableSorting: false,
  }

  const columns: ColumnDef<FileSchema>[] = [
    {
      id: ColumnKey.originalName,
      accessorFn: (row) => row.original_name,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={i18n.t('files.table.name')}
        />
      ),
      cell: ({ row }) => {
        const file = row.original
        const isPrivate = isFilePrivate(file)
        const diskLabel = getFileDiskLabel(file.disk, isPrivate)
        const diskTooltip = getFileDiskTooltip(file.disk, isPrivate)
        const cat = getFileCategory(
          file.mime,
          file.resource_type,
          file.original_name
        )
        const catMeta = FILE_CATEGORY_CONFIG[cat]
        const CatIcon = catMeta.icon

        return (
          <div className='flex min-w-0 items-center gap-3'>
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border',
                catMeta.bgColor,
                catMeta.borderColor
              )}
            >
              {cat === 'image' || cat === 'video' ? (
                <FilePreviewThumbnail
                  file={file}
                  transformations='w_80,h_80,c_fill,q_75'
                  hoverToPlay={false}
                />
              ) : (
                <CatIcon className={cn('size-4', catMeta.textColor)} />
              )}
            </div>
            <div className='min-w-0'>
              <div className='flex items-center gap-1.5'>
                <p className='text-foreground truncate text-sm font-medium'>
                  {file.original_name}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-sm px-1 py-0.5 text-[10px] font-medium',
                        isPrivate
                          ? 'border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground border-border/60 border'
                      )}
                    >
                      {isPrivate ? (
                        <Lock className='size-2.5' />
                      ) : (
                        <Globe className='size-2.5' />
                      )}
                      <span>{diskLabel}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side='top' className='max-w-xs text-xs'>
                    {diskTooltip}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className='text-muted-foreground truncate text-xs'>
                {file.public_id}
              </p>
            </div>
          </div>
        )
      },
      meta: {
        label: i18n.t('files.table.name'),
        placeholder: i18n.t('files.filters.name'),
        variant: 'text',
        icon: FileIcon,
      },
      enableColumnFilter: true,
      enableSorting: true,
      minSize: 260,
    },
    {
      id: ColumnKey.resourceType,
      accessorFn: (row) => row.resource_type,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={i18n.t('files.table.type')}
        />
      ),
      cell: ({ row }) => {
        const file = row.original
        const cat = getFileCategory(
          file.mime,
          file.resource_type,
          file.original_name
        )
        const catMeta = FILE_CATEGORY_CONFIG[cat]

        return (
          <Badge
            variant='outline'
            className={cn(
              'border text-xs font-normal capitalize',
              catMeta.bgColor,
              catMeta.textColor,
              catMeta.borderColor
            )}
          >
            {catMeta.label}
          </Badge>
        )
      },
      meta: {
        label: i18n.t('files.table.type'),
        placeholder: i18n.t('files.table.type'),
        variant: 'select',
        options: [
          { label: i18n.t('files.categories.images'), value: 'image' },
          { label: i18n.t('files.categories.videos'), value: 'video' },
          { label: i18n.t('files.categories.documents'), value: 'raw' },
          { label: i18n.t('files.categories.audio'), value: 'file' },
        ],
        icon: Tag,
      },
      enableColumnFilter: true,
      enableSorting: true,
      size: 130,
    },
    {
      id: ColumnKey.size,
      accessorFn: (row) => row.size,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={i18n.t('files.table.size')}
        />
      ),
      cell: ({ row }) => (
        <span className='text-muted-foreground text-xs tabular-nums'>
          {formatBytes(row.original.size)}
        </span>
      ),
      meta: {
        label: i18n.t('files.table.size'),
      },
      enableColumnFilter: false,
      enableSorting: true,
      size: 100,
    },
    {
      id: ColumnKey.uploadedBy,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={i18n.t('files.table.uploadedBy', 'Uploaded by')}
        />
      ),
      cell: ({ row }) => {
        const uploader = row.original.createdByAdmin
        const name =
          uploader?.fullName ||
          uploader?.email ||
          i18n.t('files.table.system', 'System')
        const initials = name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()

        return (
          <div className='flex max-w-44 min-w-0 items-center gap-2'>
            <Avatar className='border-border/60 size-6 shrink-0 border'>
              {uploader?.avatar && (
                <AvatarImage src={uploader.avatar} alt={name} />
              )}
              <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-semibold'>
                {initials || 'U'}
              </AvatarFallback>
            </Avatar>
            <span
              className='text-foreground truncate text-xs font-medium'
              title={name}
            >
              {name}
            </span>
          </div>
        )
      },
      meta: {
        label: i18n.t('files.table.uploadedBy', 'Uploaded by'),
      },
      enableColumnFilter: false,
      enableSorting: false,
      size: 140,
    },
    {
      id: ColumnKey.updatedAt,
      accessorFn: (row) => row.updatedAt,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={i18n.t('files.table.lastActivity', 'Last activity')}
        />
      ),
      cell: ({ row }) => {
        const updatedDate = new Date(row.original.updatedAt)
        const updater = row.original.updatedByAdmin
        return (
          <div className='flex flex-col text-xs'>
            <span className='text-foreground font-medium'>
              {format(updatedDate, 'dd/MM/yyyy HH:mm')}
            </span>
            {updater && (
              <span className='text-muted-foreground max-w-36 truncate text-[11px]'>
                {updater.fullName || updater.email}
              </span>
            )}
          </div>
        )
      },
      meta: {
        label: i18n.t('files.table.lastActivity', 'Last activity'),
        variant: 'dateRange',
        icon: Calendar,
      },
      enableColumnFilter: false,
      enableSorting: true,
      size: 140,
    },
    {
      id: ColumnKey.createdAt,
      accessorFn: (row) => row.createdAt,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={i18n.t('files.table.createdAt')}
        />
      ),
      cell: ({ row }) => (
        <span className='text-muted-foreground text-xs'>
          {format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm')}
        </span>
      ),
      meta: {
        label: i18n.t('files.table.createdAt'),
        variant: 'dateRange',
        icon: Calendar,
      },
      enableColumnFilter: true,
      enableSorting: true,
      size: 140,
    },
    {
      id: ColumnKey.actions,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={i18n.t('files.table.actions')}
        />
      ),
      cell: ({ row }) => {
        const isTrash = Boolean(row.original.deletedAt)

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                aria-label={i18n.t('files.table.actions', 'Actions')}
              >
                <MoreHorizontal className='size-4' aria-hidden='true' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onPreview(row.original)}>
                <Eye className='size-4' />
                {i18n.t('files.actions.preview')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadFile(row.original)}>
                <Download className='size-4' />
                {i18n.t('files.actions.download', 'Download')}
              </DropdownMenuItem>

              {isTrash ? (
                <>
                  <DropdownMenuSeparator />
                  {canUpdate && onRestore && (
                    <DropdownMenuItem
                      onClick={() => onRestore(row.original)}
                      className='text-primary'
                    >
                      <RotateCcw className='size-4' />
                      {i18n.t('files.actions.restore', 'Restore')}
                    </DropdownMenuItem>
                  )}
                  {canDelete && onPermanentDelete && (
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => onPermanentDelete(row.original)}
                    >
                      <Trash2 className='size-4' />
                      {i18n.t(
                        'files.actions.permanentDelete',
                        'Delete permanently'
                      )}
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onCopyUrl(row.original)}>
                    <Copy className='size-4' />
                    {i18n.t('files.actions.copyUrl')}
                  </DropdownMenuItem>
                  {isFilePrivate(row.original) && onShare && (
                    <DropdownMenuItem
                      onClick={() => onShare(row.original)}
                      className='text-amber-600 dark:text-amber-400'
                    >
                      <Link2 className='size-4' />
                      {i18n.t('files.actions.share', 'Share link')}
                    </DropdownMenuItem>
                  )}
                  {canUpdate && onRename && (
                    <DropdownMenuItem onClick={() => onRename(row.original)}>
                      <Pencil className='size-4' />
                      {i18n.t('files.actions.rename', 'Rename')}
                    </DropdownMenuItem>
                  )}
                  {canUpdate && (
                    <DropdownMenuItem onClick={() => onMove(row.original)}>
                      <MoveRight className='size-4' />
                      {i18n.t('files.actions.move')}
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant='destructive'
                        onClick={() => onDelete(row.original)}
                      >
                        <Trash2 className='size-4' />
                        {i18n.t('files.actions.delete')}
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 64,
      enableColumnFilter: false,
      enableHiding: false,
      enableSorting: false,
    },
  ]

  const baseColumns = [starColumn, ...columns]
  return canDelete ? [selectionColumn, ...baseColumns] : baseColumns
}
