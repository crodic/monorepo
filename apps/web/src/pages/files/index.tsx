import {
  FolderPlus,
  LayoutGrid,
  List,
  MousePointer,
  PanelRight,
  PlusIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DeleteAlertDialog } from '@/components/common/delete-alert-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Main } from '@/components/layout/main'
import {
  DeleteFolderDialog,
  FileBreadcrumbs,
  FileDropzoneOverlay,
  FileGridToolbar,
  FileGridView,
  FileInspector,
  FolderCardGrid,
  FolderDialog,
  FolderPanel,
  MoveFileDialog,
  PreviewDialog,
  QuickFilterChips,
  RenameFileDialog,
  ShareUrlDialog,
  UploadDialog,
} from './components'
import { bulkDownloadFiles } from './download-helper'
import { FilePickerDialog } from './file-picker-dialog'
import { FilesTableActionBar } from './file-table-action-bar'
import { useFileManagerCore } from './use-file-manager-core'

export function PageFileOverview() {
  const { t } = useTranslation()
  const { ability } = useAuthStore()

  const {
    // Navigation & View
    activeFolder,
    viewMode,
    handleViewModeChange,
    activeCategory,
    handleFolderSelect,
    handleCategorySelect,
    handleDropFiles,

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

    // Actions & Operations
    invalidateFiles,
    handleInspectFile,
    handleCreateFolder,
    handleRenameFolder,
    handleMoveFile,
    copyFileUrl,
    deleteFileMutation,
    deleteFolderMutation,
    bulkDeleteFileMutation,
  } = useFileManagerCore()

  return (
    <>
      <FileDropzoneOverlay
        activeFolder={activeFolder}
        onDropFiles={handleDropFiles}
        disabled={!ability.can('create', 'FILE')}
      />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {/* Top Header & Action Controls */}
        <div className='border-border/70 flex flex-wrap items-center justify-between gap-3 border-b pb-4'>
          <div className='flex flex-col gap-1'>
            <FileBreadcrumbs
              activeFolder={activeFolder}
              onSelectFolder={handleFolderSelect}
              itemCount={totalItems}
              isFetching={isFetching}
            />
            {pickedUrl && (
              <p className='text-muted-foreground mt-0.5 max-w-[min(720px,80vw)] truncate text-xs'>
                {t('files.picker.demoValue')}: {pickedUrl}
              </p>
            )}
          </div>

          <div className='flex items-center gap-2'>
            {/* View Mode Toggle */}
            <div className='border-border/80 bg-muted/40 flex items-center rounded-lg border p-0.5'>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size='icon'
                aria-label={t('files.view.grid', 'Grid view')}
                className='size-7 rounded-md'
                onClick={() => handleViewModeChange('grid')}
                title={t('files.view.grid')}
              >
                <LayoutGrid className='size-3.5' aria-hidden='true' />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size='icon'
                aria-label={t('files.view.table', 'Table view')}
                className='size-7 rounded-md'
                onClick={() => handleViewModeChange('table')}
                title={t('files.view.table')}
              >
                <List className='size-3.5' aria-hidden='true' />
              </Button>
            </div>

            {/* Inspector Toggle Button */}
            <Button
              variant={inspectorOpen ? 'secondary' : 'outline'}
              size='icon'
              aria-label={t('files.inspector.title', 'File inspector')}
              className={cn(
                'size-8',
                inspectorOpen && 'border-primary/50 text-primary'
              )}
              onClick={() => setInspectorOpen((prev) => !prev)}
              title={t('files.inspector.title')}
            >
              <PanelRight className='size-4' aria-hidden='true' />
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='h-8 gap-1.5 text-xs'
              onClick={() => setPickerOpen(true)}
            >
              <MousePointer className='size-3.5' />
              <span className='hidden sm:inline'>
                {t('files.picker.demoButton')}
              </span>
            </Button>

            {ability.can('create', 'FILE') && (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 gap-1.5 text-xs'
                  onClick={() => setFolderDialogOpen(true)}
                >
                  <FolderPlus className='size-3.5' />
                  <span className='hidden sm:inline'>
                    {t('files.actions.createFolder')}
                  </span>
                </Button>
                <Button
                  size='sm'
                  className='h-8 gap-1.5 text-xs'
                  onClick={() => {
                    setDroppedFiles([])
                    setUploadOpen(true)
                  }}
                >
                  <PlusIcon className='size-3.5' />
                  <span>{t('files.actions.upload')}</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Body Layout */}
        <div className='grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]'>
          {/* Left Sidebar */}
          <FolderPanel
            folders={folders}
            activeFolder={activeFolder}
            activeCategory={activeCategory}
            totalFiles={totalItems ?? 0}
            onSelect={handleFolderSelect}
            onSelectCategory={handleCategorySelect}
            onCreateFolder={() => setFolderDialogOpen(true)}
            onRename={() => {
              setFolderToRename(activeFolder)
              setRenameFolderOpen(true)
            }}
            onDelete={() => setDeletingFolder(activeFolder)}
            canCreate={ability.can('create', 'FILE')}
            canUpdate={ability.can('update', 'FILE')}
            canDelete={ability.can('delete', 'FILE')}
          />

          {/* Right Workspace Content */}
          <div className='flex min-w-0 flex-1 flex-col gap-5'>
            {/* Quick Access Folders for current directory */}
            {(() => {
              const currentSubfolders = folders.filter((f) =>
                activeFolder === null
                  ? !f.parent || f.depth === 0
                  : f.parent === activeFolder
              )
              if (currentSubfolders.length === 0) return null

              return (
                <FolderCardGrid
                  folders={currentSubfolders}
                  activeFolder={activeFolder}
                  onSelectFolder={handleFolderSelect}
                  onRenameFolder={(folder) => {
                    setFolderToRename(folder)
                    setRenameFolderOpen(true)
                  }}
                  onDeleteFolder={(folder) => setDeletingFolder(folder)}
                  canUpdate={ability.can('update', 'FILE')}
                  canDelete={ability.can('delete', 'FILE')}
                />
              )
            })()}

            {/* Grid View Mode */}
            {viewMode === 'grid' ? (
              <div className='flex flex-col gap-4'>
                <FileGridToolbar
                  table={table}
                  activeCategory={activeCategory}
                  onSelectCategory={handleCategorySelect}
                />

                <FileGridView
                  files={currentFiles}
                  table={table}
                  isFetching={isFetching}
                  inspectedFile={inspectedFile}
                  onInspectFile={handleInspectFile}
                  onPreviewFile={setPreviewFile}
                  onCopyUrl={copyFileUrl}
                  onMoveFile={setMovingFile}
                  onDeleteFile={setDeletingFile}
                  onRenameFile={setRenamingFile}
                  onShareFile={setSharingFile}
                  canUpdate={ability.can('update', 'FILE')}
                  canDelete={ability.can('delete', 'FILE')}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  totalItems={totalItems}
                />
              </div>
            ) : (
              /* Table View Mode */
              <div className='flex flex-col gap-3'>
                <QuickFilterChips
                  activeType={activeCategory}
                  onSelectType={handleCategorySelect}
                />
                <DataTable
                  table={table}
                  onClickRowAction={handleInspectFile}
                  isFetching={isFetching}
                >
                  <DataTableToolbar table={table}>
                    <DataTableSortList table={table} />
                  </DataTableToolbar>
                </DataTable>
              </div>
            )}
          </div>
        </div>
      </Main>

      {/* Bulk Action Bar */}
      <FilesTableActionBar
        table={table}
        onDelete={(files) => setBulkDeletingFiles(files)}
        onBulkDownload={(files) => void bulkDownloadFiles(files)}
        disabled={ability.can('delete', 'FILE') === false}
      />

      {/* File Inspector Drawer */}
      <FileInspector
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        file={inspectedFile}
        onPreview={setPreviewFile}
        onCopyUrl={copyFileUrl}
        onMove={setMovingFile}
        onDelete={setDeletingFile}
        onRename={setRenamingFile}
        onShare={setSharingFile}
        onFileUpdated={(file) => setInspectedFile(file)}
        canUpdate={ability.can('update', 'FILE')}
        canDelete={ability.can('delete', 'FILE')}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        folder={activeFolder}
        folders={folders}
        initialFiles={droppedFiles}
        onOpenChange={(open) => {
          setUploadOpen(open)
          if (!open) setDroppedFiles([])
        }}
        onUploaded={invalidateFiles}
        onCreateLocalFolder={(folder) => {
          handleFolderSelect(folder)
        }}
      />

      {/* Create Folder Dialog */}
      <FolderDialog
        open={folderDialogOpen}
        title={t('files.folders.createTitle')}
        submitLabel={t('files.actions.createFolder')}
        existingFolders={folders.map((item) => item.folder)}
        onOpenChange={setFolderDialogOpen}
        onSubmit={handleCreateFolder}
      />

      {/* Rename Folder Dialog */}
      <FolderDialog
        open={renameFolderOpen}
        title={t('files.folders.renameTitle')}
        submitLabel={t('buttons.save')}
        defaultValue={folderToRename ?? activeFolder ?? ''}
        existingFolders={folders.map((item) => item.folder)}
        onOpenChange={(open) => {
          setRenameFolderOpen(open)
          if (!open) setFolderToRename(null)
        }}
        onSubmit={handleRenameFolder}
      />

      {/* Move File Dialog */}
      <MoveFileDialog
        file={movingFile}
        folders={folders}
        onOpenChange={(open) => !open && setMovingFile(null)}
        onMoved={handleMoveFile}
      />

      {/* Preview Dialog */}
      <PreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />

      {/* Rename File Dialog */}
      <RenameFileDialog
        open={Boolean(renamingFile)}
        file={renamingFile}
        onOpenChange={(open) => !open && setRenamingFile(null)}
        onRenamed={(updated) => {
          if (inspectedFile?.public_id === updated.public_id) {
            setInspectedFile(updated)
          }
        }}
      />

      {/* Share / Presigned URL Dialog */}
      <ShareUrlDialog
        open={Boolean(sharingFile)}
        file={sharingFile}
        onOpenChange={(open) => !open && setSharingFile(null)}
      />

      {/* Demo File Picker Dialog */}
      <FilePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode='url'
        value={pickedUrl}
        onValueChange={(value) => setPickedUrl(value)}
      />

      {/* Delete Single File Alert */}
      {deletingFile && (
        <DeleteAlertDialog
          open={Boolean(deletingFile)}
          onOpenChange={(open) => !open && setDeletingFile(null)}
          handleDelete={() => deleteFileMutation.mutate(deletingFile.public_id)}
          isLoading={deleteFileMutation.isPending}
          title='files.delete.title'
          description='files.delete.description'
        />
      )}

      {/* Delete Bulk Files Alert */}
      {bulkDeletingFiles.length > 0 && (
        <DeleteAlertDialog
          open={bulkDeletingFiles.length > 0}
          onOpenChange={(open) => !open && setBulkDeletingFiles([])}
          handleDelete={() => bulkDeleteFileMutation.mutate(bulkDeletingFiles)}
          isLoading={bulkDeleteFileMutation.isPending}
          title='files.delete.bulkTitle'
          description='files.delete.bulkDescription'
          translationValues={{ count: String(bulkDeletingFiles.length) }}
        />
      )}

      {/* Delete Folder Alert */}
      <DeleteFolderDialog
        folder={deletingFolder}
        deleteFiles={deleteFolderFiles}
        isLoading={deleteFolderMutation.isPending}
        onDeleteFilesChange={setDeleteFolderFiles}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingFolder(null)
            setDeleteFolderFiles(false)
          }
        }}
        onConfirm={() => {
          if (!deletingFolder) return
          deleteFolderMutation.mutate({
            folder: deletingFolder,
            deleteFiles: deleteFolderFiles,
          })
        }}
      />
    </>
  )
}
