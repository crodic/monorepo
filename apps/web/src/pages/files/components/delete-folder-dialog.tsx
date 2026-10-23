import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'

export interface DeleteFolderDialogProps {
  folder: string | null
  deleteFiles: boolean
  isLoading: boolean
  onDeleteFilesChange: (checked: boolean) => void
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteFolderDialog({
  folder,
  deleteFiles,
  isLoading,
  onDeleteFilesChange,
  onOpenChange,
  onConfirm,
}: DeleteFolderDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={Boolean(folder)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('files.folders.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('files.folders.deleteDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <label className='border-border flex cursor-pointer items-start gap-3 rounded-md border p-3'>
          <Checkbox
            checked={deleteFiles}
            onCheckedChange={(checked) => onDeleteFilesChange(checked === true)}
          />
          <span className='grid gap-1 text-sm'>
            <span className='font-medium'>
              {t('files.folders.deleteFilesLabel')}
            </span>
            <span className='text-muted-foreground'>
              {t('files.folders.deleteFilesDescription')}
            </span>
          </span>
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('buttons.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={isLoading}
            onClick={onConfirm}
          >
            {t('buttons.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
