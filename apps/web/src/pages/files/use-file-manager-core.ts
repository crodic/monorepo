import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { getSortingStateParser } from '@/lib/parsers'
import { PaginateQueryBuilder } from '@/lib/query-builder'
import { restApiErrorHandler } from '@/lib/rest-api-handler'
import { normalizeDate, sortParser } from '@/lib/utils'
import { useDataTable } from '@/hooks/use-data-table'
import useGetFilterParams from '@/hooks/use-get-filter-params'
import { getFilesTableColumns } from './columns'
import type { FileViewType } from './components/files-sub-sidebar'
import {
  apiCreateFolder,
  apiDeleteFile,
  apiDeleteFiles,
  apiDeleteFolder,
  apiRenameFolder,
  apiUpdateFile,
  fileQueryKeys,
  useDataFileFolders,
  useDataFileOverview,
  useInfiniteDataFileOverview,
} from './queries'
import { ColumnKey, type FileSchema, type FolderSchema } from './schema'
import { useStarredFiles } from './use-starred-files'

export const fileFilterParsers = {
  [ColumnKey.originalName]: parseAsString,
  [ColumnKey.folder]: parseAsString,
  [ColumnKey.resourceType]: parseAsString,
  [ColumnKey.mime]: parseAsString,
  [ColumnKey.status]: parseAsString,
  [ColumnKey.createdAt]: parseAsArrayOf(parseAsInteger, ','),
} as const

export const fileAllowedSorts = [
  ColumnKey.originalName,
  ColumnKey.folder,
  ColumnKey.resourceType,
  ColumnKey.mime,
  ColumnKey.status,
  ColumnKey.size,
  ColumnKey.createdAt,
]

export async function copyFileUrl(file: FileSchema) {
  await navigator.clipboard.writeText(file.url)
}

export function useFileManagerCore() {
  const { t } = useTranslation()
  const { ability } = useAuthStore()
  const queryClient = useQueryClient()

  // --- View Mode & Navigation ---
  const [activeView, setActiveView] = useState<FileViewType>('all')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const {
    starredCount: localStarredCount,
    isStarred: isLocalStarred,
    toggleStar: toggleLocalStar,
  } = useStarredFiles()

  useEffect(() => {
    const saved = window.localStorage.getItem('file-manager:view-mode')
    if (saved === 'grid' || saved === 'table') {
      setViewMode(saved)
    }
  }, [])

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('file-manager:view-mode', mode)
    }
  }

  // --- Modals and Active Entities ---
  const [localFolders, setLocalFolders] = useState<FolderSchema[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [renameFolderOpen, setRenameFolderOpen] = useState(false)
  const [folderToRename, setFolderToRename] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<FileSchema | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [inspectedFile, setInspectedFile] = useState<FileSchema | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedUrl, setPickedUrl] = useState<string | null>(null)
  const [movingFile, setMovingFile] = useState<FileSchema | null>(null)
  const [renamingFile, setRenamingFile] = useState<FileSchema | null>(null)
  const [sharingFile, setSharingFile] = useState<FileSchema | null>(null)
  const [deletingFile, setDeletingFile] = useState<FileSchema | null>(null)
  const [bulkDeletingFiles, setBulkDeletingFiles] = useState<FileSchema[]>([])
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null)
  const [deleteFolderFiles, setDeleteFolderFiles] = useState(false)

  // --- Query Params & Pagination ---
  const [, setPageQuery] = useQueryState('page', parseAsInteger.withDefault(1))
  const [, setSearchQuery] = useQueryState(
    'search',
    parseAsString.withDefault('')
  )
  const [, setSortQuery] = useQueryState(
    'sort',
    getSortingStateParser<FileSchema>(fileAllowedSorts).withDefault([])
  )
  const [, setFilterQuery] = useQueryStates(fileFilterParsers)

  const {
    page,
    perPage,
    sorting: sort,
    filter,
    search,
  } = useGetFilterParams<FileSchema, typeof fileFilterParsers>({
    allowedSorts: fileAllowedSorts,
    filterParsers: fileFilterParsers,
  })

  const createdFrom = normalizeDate(filter.createdAt?.[0])
  const createdTo = normalizeDate(filter.createdAt?.[1])

  const params = useMemo(() => {
    const builder = new PaginateQueryBuilder()
      .page(page)
      .limit(perPage)
      .ilike('original_name', filter.original_name)
      .ilike('folder', filter.folder)
      .ilike('mime', filter.mime)
      .eq('resource_type', filter.resource_type)
      .btw('createdAt', createdFrom, createdTo)
      .search(search)

    // Handle view-specific filtering/sorting
    if (activeView === 'trash') {
      builder.eq('status', 'archived')
    } else if (activeView === 'starred') {
      builder.eq('is_starred', true)
    } else if (filter.status) {
      builder.eq('status', filter.status)
    } else {
      builder.eq('status', 'active')
    }

    if (activeView === 'recent') {
      builder.applySorts([{ sortBy: 'createdAt', sortDirection: 'DESC' }])
    } else {
      builder.applySorts(sortParser(sort))
    }

    if (activeFolder) {
      builder.eq('folder', activeFolder)
    }

    return builder.build()
  }, [
    page,
    perPage,
    filter.original_name,
    filter.folder,
    filter.mime,
    filter.resource_type,
    filter.status,
    createdFrom,
    createdTo,
    sort,
    search,
    activeFolder,
    activeView,
  ])

  // Derive activeCategory from URL params so it persists across page reloads
  const activeCategory = useMemo(() => {
    const mime = typeof filter.mime === 'string' ? filter.mime : null
    const resourceType =
      typeof filter.resource_type === 'string' ? filter.resource_type : null
    if (mime === 'audio') return 'audio'
    if (resourceType) return resourceType
    return null
  }, [filter.mime, filter.resource_type])

  const isGridView = viewMode === 'grid'

  const { data: pagedData, isFetching: isPagedFetching } = useDataFileOverview(
    params,
    { enabled: !isGridView }
  )

  const infiniteParams = useMemo(
    () => ({
      ...params,
      limit: 24,
    }),
    [params]
  )

  const {
    data: infiniteData,
    isFetching: isInfiniteFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteDataFileOverview(infiniteParams, { enabled: isGridView })

  const { data: remoteFolders = [] } = useDataFileFolders()

  const allGridFiles = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.data) ?? [],
    [infiniteData?.pages]
  )

  const currentFiles = useMemo(() => {
    const rawFiles = isGridView ? allGridFiles : (pagedData?.data ?? [])
    if (activeView === 'starred') {
      return rawFiles.filter((f) => f.is_starred || isLocalStarred(f.public_id))
    }
    return rawFiles
  }, [activeView, isGridView, allGridFiles, pagedData?.data, isLocalStarred])

  const isFetching = isGridView ? isInfiniteFetching : isPagedFetching
  const totalItems = useMemo(() => {
    if (activeView === 'starred') {
      return currentFiles.length
    }
    return isGridView
      ? infiniteData?.pages[0]?.meta.totalItems
      : pagedData?.meta.totalItems
  }, [
    activeView,
    currentFiles.length,
    isGridView,
    infiniteData?.pages,
    pagedData?.meta.totalItems,
  ])

  const folders = useMemo(() => {
    const map = new Map<string, FolderSchema>()
    for (const folder of [...localFolders, ...remoteFolders]) {
      map.set(folder.folder, folder)
    }
    return Array.from(map.values()).sort((a, b) =>
      a.folder.localeCompare(b.folder)
    )
  }, [localFolders, remoteFolders])

  // --- Cache Invalidation ---
  const invalidateFiles = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: fileQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: fileQueryKeys.folders }),
    ])
  }, [queryClient])

  // --- Star Handlers ---
  const isStarred = useCallback(
    (publicId?: string | null) => {
      if (!publicId) return false
      const found = currentFiles.find((f) => f.public_id === publicId)
      if (found?.is_starred !== undefined) {
        return found.is_starred
      }
      return isLocalStarred(publicId)
    },
    [currentFiles, isLocalStarred]
  )

  const toggleStar = useCallback(
    async (publicId: string) => {
      const found = currentFiles.find((f) => f.public_id === publicId)
      const currentVal = found?.is_starred ?? isLocalStarred(publicId)
      const nextVal = !currentVal

      // Local update for instant optimistic UI
      toggleLocalStar(publicId)

      try {
        await apiUpdateFile({
          publicId,
          data: { is_starred: nextVal },
        })
        await invalidateFiles()
      } catch {
        // Rollback if network fails
        toggleLocalStar(publicId)
      }
    },
    [currentFiles, isLocalStarred, toggleLocalStar, invalidateFiles]
  )

  const starredCount = useMemo(() => {
    const dbStarredCount = currentFiles.filter((f) => f.is_starred).length
    return Math.max(dbStarredCount, localStarredCount)
  }, [currentFiles, localStarredCount])

  // --- Inspect Handler ---
  const handleInspectFile = useCallback((file: FileSchema) => {
    setInspectedFile(file)
    setInspectorOpen(true)
  }, [])

  // --- Table Configuration ---
  const columns = useMemo(
    () =>
      getFilesTableColumns({
        onPreview: setPreviewFile,
        onCopyUrl: copyFileUrl,
        onMove: setMovingFile,
        onDelete: setDeletingFile,
        onRename: setRenamingFile,
        onShare: setSharingFile,
        isStarred,
        onToggleStar: toggleStar,
        canUpdate: ability.can('update', 'FILE'),
        canDelete: ability.can('delete', 'FILE'),
      }),
    [ability, isStarred, toggleStar]
  )

  const { table } = useDataTable({
    data: currentFiles,
    columns,
    pageCount: pagedData?.meta.totalPages ?? 0,
    initialState: {
      columnPinning: { left: ['select'], right: ['actions'] },
    },
    getRowId: (row) => row.public_id,
  })

  // --- Mutations ---
  const deleteFileMutation = useMutation({
    mutationFn: apiDeleteFile,
    onSuccess: async () => {
      await invalidateFiles()
      if (inspectedFile?.public_id === deletingFile?.public_id) {
        setInspectedFile(null)
      }
      setDeletingFile(null)
    },
    onError: (error) => restApiErrorHandler(error as never),
  })

  const deleteFolderMutation = useMutation({
    mutationFn: apiDeleteFolder,
    onSuccess: async () => {
      setLocalFolders((current) =>
        current.filter((folder) => folder.folder !== deletingFolder)
      )
      if (activeFolder === deletingFolder) {
        setActiveFolder(null)
      }
      setDeletingFolder(null)
      setDeleteFolderFiles(false)
      await invalidateFiles()
    },
    onError: (error) => restApiErrorHandler(error as never),
  })

  const bulkDeleteFileMutation = useMutation({
    mutationFn: (files: FileSchema[]) =>
      apiDeleteFiles(files.map((file) => file.public_id)),
    onSuccess: async (_, files) => {
      table.resetRowSelection()
      setBulkDeletingFiles([])
      await invalidateFiles()
      toast.success(t('files.delete.bulkSuccess', { count: files.length }))
    },
    onError: (error) => restApiErrorHandler(error as never),
  })

  // --- Selection & Navigation Handlers ---
  const handleFolderSelect = useCallback(
    (folder: string | null) => {
      setActiveView('all')
      if (folder === activeFolder) return

      setActiveFolder(folder)
      table.setPageIndex(0)
      table.resetColumnFilters()
      table.resetSorting()
      table.resetRowSelection()
      void setPageQuery(1)
      void setSearchQuery(null)
      void setSortQuery(null)
      void setFilterQuery({
        [ColumnKey.originalName]: null,
        [ColumnKey.folder]: null,
        [ColumnKey.resourceType]: null,
        [ColumnKey.mime]: null,
        [ColumnKey.status]: null,
        [ColumnKey.createdAt]: null,
      })
    },
    [
      activeFolder,
      table,
      setPageQuery,
      setSearchQuery,
      setSortQuery,
      setFilterQuery,
    ]
  )

  const handleCategorySelect = useCallback(
    (category: string | null) => {
      table.setPageIndex(0)
      void setPageQuery(1)

      if (!category || category === 'all') {
        void setFilterQuery((current) => ({
          ...current,
          [ColumnKey.resourceType]: null,
          [ColumnKey.mime]: null,
        }))
      } else if (category === 'audio') {
        void setFilterQuery((current) => ({
          ...current,
          [ColumnKey.resourceType]: null,
          [ColumnKey.mime]: 'audio',
        }))
      } else {
        void setFilterQuery((current) => ({
          ...current,
          [ColumnKey.resourceType]: category,
          [ColumnKey.mime]: null,
        }))
      }
    },
    [table, setPageQuery, setFilterQuery]
  )

  const handleDropFiles = useCallback((files: File[]) => {
    if (files.length > 0) {
      setDroppedFiles(files)
      setUploadOpen(true)
    }
  }, [])

  const handleCreateFolder = useCallback(
    async (folderName: string) => {
      const created = await apiCreateFolder({ folder: folderName })
      setLocalFolders((current) => [
        ...current.filter((item) => item.folder !== created.folder),
        created,
      ])
      handleFolderSelect(created.folder)
    },
    [handleFolderSelect]
  )

  const handleRenameFolder = useCallback(
    async (newFolderName: string) => {
      const target = folderToRename ?? activeFolder
      if (!target) return
      const renamed = await apiRenameFolder({
        folder: target,
        data: { folder: newFolderName },
      })
      handleFolderSelect(renamed.folder)
      setFolderToRename(null)
      await invalidateFiles()
    },
    [folderToRename, activeFolder, handleFolderSelect, invalidateFiles]
  )

  const handleMoveFile = useCallback(
    async (folder: string | null) => {
      if (!movingFile) return
      await apiUpdateFile({
        publicId: movingFile.public_id,
        data: { folder },
      })
      if (inspectedFile?.public_id === movingFile.public_id) {
        setInspectedFile((prev) => (prev ? { ...prev, folder } : null))
      }
      setMovingFile(null)
      await invalidateFiles()
    },
    [movingFile, inspectedFile, invalidateFiles]
  )

  return {
    // Navigation & View
    activeView,
    setActiveView,
    activeFolder,
    setActiveFolder,
    viewMode,
    handleViewModeChange,
    activeCategory,
    handleFolderSelect,
    handleCategorySelect,
    handleDropFiles,
    search: search || '',
    setSearch: setSearchQuery,
    starredCount,
    isStarred,
    toggleStar,

    // Data & Collections
    folders,
    currentFiles,
    totalItems,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    table,

    // Modal States & Setters
    uploadOpen,
    setUploadOpen,
    droppedFiles,
    setDroppedFiles,
    folderDialogOpen,
    setFolderDialogOpen,
    renameFolderOpen,
    setRenameFolderOpen,
    folderToRename,
    setFolderToRename,
    previewFile,
    setPreviewFile,
    inspectorOpen,
    setInspectorOpen,
    inspectedFile,
    setInspectedFile,
    pickerOpen,
    setPickerOpen,
    pickedUrl,
    setPickedUrl,
    movingFile,
    setMovingFile,
    renamingFile,
    setRenamingFile,
    sharingFile,
    setSharingFile,
    deletingFile,
    setDeletingFile,
    bulkDeletingFiles,
    setBulkDeletingFiles,
    deletingFolder,
    setDeletingFolder,
    deleteFolderFiles,
    setDeleteFolderFiles,

    // Actions & Mutations
    invalidateFiles,
    handleInspectFile,
    handleCreateFolder,
    handleRenameFolder,
    handleMoveFile,
    copyFileUrl,
    deleteFileMutation,
    deleteFolderMutation,
    bulkDeleteFileMutation,
  }
}
