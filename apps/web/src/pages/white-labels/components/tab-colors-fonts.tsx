import type { RefObject } from 'react'
import {
  Code2Icon,
  DownloadIcon,
  Eye,
  FileCodeIcon,
  RotateCcwIcon,
  UploadIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  cloneDefaultThemeStyles,
  type ThemeMode,
  type ThemeStyles,
} from '@/lib/theme-builder/default-theme'
import { Button } from '@/components/ui/button'
import { ThemeTokenEditor } from './theme-token-editor'

type TabColorsFontsProps = {
  currentStyles: ThemeStyles
  editorMode: ThemeMode
  setEditorMode: (mode: ThemeMode) => void
  onUpdateStyles: (newStyles: ThemeStyles) => void
  onOpenPasteDialog: () => void
  onOpenCodeDialog: () => void
  onCopyCss: () => void
  onExportJson: () => void
  onViewLivePreview: () => void
  cssInputRef: RefObject<HTMLInputElement | null>
  jsonInputRef: RefObject<HTMLInputElement | null>
}

export function TabColorsFonts({
  currentStyles,
  editorMode,
  setEditorMode,
  onUpdateStyles,
  onOpenPasteDialog,
  onOpenCodeDialog,
  onCopyCss,
  onExportJson,
  onViewLivePreview,
  cssInputRef,
  jsonInputRef,
}: TabColorsFontsProps) {
  return (
    <div className='space-y-4'>
      {/* Top Toolbar: Import CSS/JSON, Paste CSS, Copy CSS, Export, Code View, Reset */}
      <div className='bg-card/70 flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 shadow-xs'>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 gap-1.5 text-xs'
            onClick={() => cssInputRef.current?.click()}
          >
            <UploadIcon className='size-3.5' />
            Import CSS File
          </Button>

          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 gap-1.5 text-xs'
            onClick={onOpenPasteDialog}
          >
            <Code2Icon className='text-primary size-3.5' />
            Paste CSS Variables
          </Button>

          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 gap-1.5 text-xs'
            onClick={() => jsonInputRef.current?.click()}
          >
            <UploadIcon className='size-3.5' />
            Import JSON
          </Button>

          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 gap-1.5 text-xs'
            onClick={onCopyCss}
          >
            <FileCodeIcon className='size-3.5' />
            Copy CSS
          </Button>

          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 gap-1.5 text-xs'
            onClick={onExportJson}
          >
            <DownloadIcon className='size-3.5' />
            Export JSON
          </Button>

          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 gap-1.5 text-xs'
            onClick={onOpenCodeDialog}
          >
            <FileCodeIcon className='size-3.5' />
            Code View
          </Button>

          <Button
            type='button'
            size='sm'
            variant='ghost'
            className='h-8 gap-1.5 text-xs'
            onClick={() => {
              onUpdateStyles(cloneDefaultThemeStyles())
              toast.success('Theme tokens reset to default blue')
            }}
          >
            <RotateCcwIcon className='size-3.5' />
            Reset Tokens
          </Button>
        </div>

        <Button
          type='button'
          size='sm'
          variant='secondary'
          className='h-8 gap-1.5 text-xs font-medium'
          onClick={onViewLivePreview}
        >
          <Eye className='text-primary size-3.5' />
          <span>View Live Preview</span>
        </Button>
      </div>

      {/* Full-width Theme Token Editor */}
      <ThemeTokenEditor
        value={currentStyles}
        mode={editorMode}
        onModeChange={setEditorMode}
        onChange={onUpdateStyles}
      />
    </div>
  )
}
