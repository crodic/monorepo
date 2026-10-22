import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { DeleteAlertDialog } from '@/components/common/delete-alert-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Main } from '@/components/layout/main'
import {
  DeleteFolderDialog,
  FileDropzoneOverlay,
  FileGridToolbar,
  FileGridView,
  FilesHeader,
  FileInspector,
  FilesSubSidebar,
  FolderCardGrid,
  FolderDialog,
  MoveFileDialog,
  PreviewDialog,
  QuickFilterChips,
  RenameFileDialog,
  ShareUrlDialog,
  StorageCategoryCards,
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
    activeView,
    handleViewChange,
    activeFolder,
    viewMode,
    handleViewModeChange,
    activeCategory,
    handleFolderSelect,
    handleCategorySelect,
    handleDropFiles,
    search,
    setSearch,
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

      <Main className='flex flex-1 flex-col gap-4 sm:gap-5'>
        {/* Top Header with Breadcrumbs, Search, Quick Actions & View Toggle */}
        <FilesHeader
          view={activeView}
          activeFolder={activeFolder}
          onSelectFolder={handleFolderSelect}
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onUploadClick={() => {
            setDroppedFiles([])
            setUploadOpen(true)
          }}
          onCreateFolderClick={() => setFolderDialogOpen(true)}
          onOpenPicker={() => setPickerOpen(true)}
          onToggleInspector={() => setInspectorOpen((prev) => !prev)}
          inspectorOpen={inspectorOpen}
          totalItems={totalItems}
          isFetching={isFetching}
          canCreate={ability.can('create', 'FILE')}
        />

        {/* Demo Picker Result indicator (if used) */}
        {pickedUrl && (
          <div className='bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs'>
            <span className='text-muted-foreground truncate'>
              {t('files.picker.demoValue')}: {pickedUrl}
            </span>
            <Button
              variant='ghost'
              size='sm'
              className='h-6 text-xs'
              onClick={() => setPickedUrl(null)}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Main Body Layout: Left Sub-Sidebar + Workspace Content */}
        <div className='grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]'>
          {/* Left Sub-Sidebar (Square UI style) */}
          <FilesSubSidebar
            view={activeView}
            onViewChange={handleViewChange}
            folders={folders}
            activeFolder={activeFolder}
            totalFiles={totalItems ?? 0}
            starredCount={starredCount}
            onSelectFolder={handleFolderSelect}
            onUploadClick={() => {
              setDroppedFiles([])
              setUploadOpen(true)
            }}
            onCreateFolderClick={() => setFolderDialogOpen(true)}
            onRenameFolder={(folder) => {
              setFolderToRename(folder)
              setRenameFolderOpen(true)
            }}
            onDeleteFolder={(folder) => setDeletingFolder(folder)}
            canCreate={ability.can('create', 'FILE')}
            canUpdate={ability.can('update', 'FILE')}
            canDelete={ability.can('delete', 'FILE')}
          />

          {/* Right Workspace Content */}
          <div className='flex min-w-0 flex-1 flex-col gap-5'>
            {/* Storage Category Cards (Only in All Files root view) */}
            {activeView === 'all' && activeFolder === null && (
              <StorageCategoryCards
                files={currentFiles}
                activeCategory={activeCategory}
                onSelectCategory={handleCategorySelect}
              />
            )}

            {/* Quick Access Folders for current directory */}
            {activeView === 'all' &&
              (() => {
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
                  isStarred={isStarred}
                  onToggleStar={toggleStar}
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
        files={currentFiles}
        folders={folders}
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
        defaultColor={
          folders.find((f) => f.folder === (folderToRename ?? activeFolder))
            ?.color ?? '#8B5CF6'
        }
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

      {/* Share URL Dialog */}
      <ShareUrlDialog
        open={Boolean(sharingFile)}
        file={sharingFile}
        onOpenChange={(open) => !open && setSharingFile(null)}
      />

      {/* Preview Dialog */}
      <PreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />

      {/* Delete Folder Dialog */}
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

      {/* File Picker Dialog (reusable demo) */}
      <FilePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode='url'
        value={pickedUrl}
        onValueChange={(value) => setPickedUrl(value)}
      />
    </>
  )
}
export default PageFileOverview
