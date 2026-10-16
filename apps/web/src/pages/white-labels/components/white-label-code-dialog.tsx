import { FileCodeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type WhiteLabelCodeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cssText: string
  onCopyCss: () => void
}

export function WhiteLabelCodeDialog({
  open,
  onOpenChange,
  cssText,
  onCopyCss,
}: WhiteLabelCodeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-hidden p-0 sm:max-w-4xl'>
        <DialogHeader className='border-b px-6 py-5'>
          <DialogTitle className='text-base font-semibold'>
            Theme CSS Code View
          </DialogTitle>
          <DialogDescription className='text-xs'>
            Generated shadcn & Tailwind CSS variables matching your active
            profile.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='max-h-[calc(92vh-10rem)]'>
          <pre className='bg-muted/40 overflow-x-auto p-6 font-mono text-xs leading-relaxed'>
            <code>{cssText}</code>
          </pre>
        </ScrollArea>
        <DialogFooter className='border-t px-6 py-4'>
          <Button type='button' size='sm' variant='outline' onClick={onCopyCss}>
            <FileCodeIcon className='me-1.5 size-4' />
            Copy CSS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
