import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { restApiErrorHandler } from '@/lib/rest-api-handler'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FOLDER_COLOR_PALETTE } from '../file-types'
import { isValidFolderName } from '../schema'

export interface FolderDialogProps {
  open: boolean
  title: string
  submitLabel: string
  defaultValue?: string
  defaultColor?: string
  existingFolders?: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (folder: string, color?: string) => Promise<void>
}

function getMutationErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function FolderDialog({
  open,
  title,
  submitLabel,
  defaultValue = '',
  defaultColor = '#8B5CF6',
  existingFolders,
  onOpenChange,
  onSubmit,
}: FolderDialogProps) {
  const { t } = useTranslation()
  const [folder, setFolder] = useState(defaultValue)
  const [selectedColor, setSelectedColor] = useState(defaultColor)
  const normalizedFolder = folder.trim()

  const isDuplicate =
    Boolean(normalizedFolder) &&
    Boolean(
      existingFolders?.some(
        (f) =>
          f.toLowerCase() === normalizedFolder.toLowerCase() &&
          f.toLowerCase() !== defaultValue.trim().toLowerCase()
      )
    )

  const getFolderValidationError = (): string | null => {
    if (normalizedFolder && !isValidFolderName(normalizedFolder)) {
      return t('files.folders.invalidName')
    }
    if (isDuplicate) {
      return t('files.folders.alreadyExists')
    }
    return null
  }

  const folderError = getFolderValidationError()

  const mutation = useMutation({
    mutationFn: () => onSubmit(normalizedFolder, selectedColor),
    onSuccess: () => {
      setFolder('')
      setSelectedColor(defaultColor)
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        restApiErrorHandler(error)
        return
      }

      toast.error(error instanceof Error ? error.message : 'Error')
    },
  })

  useEffect(() => {
    setFolder(defaultValue)
    setSelectedColor(defaultColor)
  }, [defaultValue, defaultColor, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4 py-1'>
          <div className='grid gap-2'>
            <Label htmlFor='folder-name'>{t('files.table.folder')}</Label>
            <Input
              id='folder-name'
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              placeholder={t(
                'files.folders.namePlaceholder',
                'e.g. Design Assets'
              )}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  normalizedFolder &&
                  !folderError &&
                  !mutation.isPending
                ) {
                  e.preventDefault()
                  mutation.mutate()
                }
              }}
            />
            {folderError && (
              <p className='text-destructive text-sm'>{folderError}</p>
            )}
            {mutation.error && (
              <p className='text-destructive text-sm'>
                {getMutationErrorMessage(mutation.error)}
              </p>
            )}
          </div>

          {/* Folder Color Palette Selector */}
          <div className='flex flex-col gap-2'>
            <Label>{t('files.folders.color', 'Folder Color')}</Label>
            <div className='flex flex-wrap items-center gap-2 pt-0.5'>
              {FOLDER_COLOR_PALETTE.map((item) => {
                const isSelected =
                  selectedColor.toLowerCase() === item.hex.toLowerCase()

                return (
                  <button
                    key={item.hex}
                    type='button'
                    onClick={() => setSelectedColor(item.hex)}
                    className={cn(
                      'flex size-7 cursor-pointer items-center justify-center rounded-full transition-all focus-visible:outline-hidden',
                      isSelected
                        ? 'ring-primary scale-110 shadow-xs ring-2 ring-offset-2'
                        : 'opacity-85 hover:scale-105 hover:opacity-100'
                    )}
                    style={{ backgroundColor: item.hex }}
                    title={item.hex}
                    aria-label={item.hex}
                  >
                    {isSelected && (
                      <Check className='size-3.5 stroke-[3] text-white drop-shadow-xs' />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              !normalizedFolder || Boolean(folderError) || mutation.isPending
            }
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
