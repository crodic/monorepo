import { useState } from 'react'
import { Code2Icon, SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { ThemeMode } from '@/lib/theme-builder/default-theme'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

type PasteScope = 'auto' | 'current' | 'light' | 'dark'

type WhiteLabelPasteCssDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editorMode: ThemeMode
  onApply: (cssText: string, scope: PasteScope) => void
}

export function WhiteLabelPasteCssDialog({
  open,
  onOpenChange,
  editorMode,
  onApply,
}: WhiteLabelPasteCssDialogProps) {
  const [pastedCssText, setPastedCssText] = useState('')
  const [pasteScope, setPasteScope] = useState<PasteScope>('auto')

  const loadSampleCss = () => {
    setPastedCssText(`:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.488 0.243 264.376);
  --primary-foreground: oklch(0.97 0.014 254.604);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.708 0 0);
  --radius: 0.65rem;
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.488 0.243 264.376);
  --primary-foreground: oklch(0.97 0.014 254.604);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}`)
  }

  const handleApply = () => {
    if (!pastedCssText.trim()) {
      toast.error('Please paste CSS variables')
      return
    }
    onApply(pastedCssText, pasteScope)
    setPastedCssText('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[80vh] flex-col overflow-hidden p-0 shadow-2xl sm:max-w-xl'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
            <Code2Icon className='text-primary size-5' />
            Paste & Inject CSS Variables
          </DialogTitle>
          <DialogDescription className='text-xs'>
            Paste CSS variables block containing <code>:root</code>,{' '}
            <code>.dark</code>, <code>@theme</code>, or direct{' '}
            <code>--variable: value</code> lines.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs font-medium'>CSS Code</Label>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='h-6 px-2 text-[11px]'
              onClick={loadSampleCss}
            >
              <SparklesIcon className='text-primary me-1 size-3' />
              Load Sample CSS
            </Button>
          </div>

          <Textarea
            rows={7}
            value={pastedCssText}
            onChange={(e) => setPastedCssText(e.target.value)}
            placeholder={`:root {\n  --primary: oklch(0.488 0.243 264.376);\n  --radius: 0.625rem;\n  ...\n}\n.dark {\n  --primary: oklch(0.488 0.243 264.376);\n  ...\n}`}
            className='max-h-48 font-mono text-xs'
          />

          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>Target Scope</Label>
            <RadioGroup
              value={pasteScope}
              onValueChange={(val) => setPasteScope(val as PasteScope)}
              className='grid grid-cols-2 gap-2 text-xs'
            >
              <div className='bg-muted/30 hover:bg-muted/50 flex items-center space-x-2 rounded-md border p-2.5 transition-colors'>
                <RadioGroupItem value='auto' id='paste-auto' />
                <Label
                  htmlFor='paste-auto'
                  className='cursor-pointer text-xs font-normal'
                >
                  Auto-detect (:root & .dark)
                </Label>
              </div>
              <div className='bg-muted/30 hover:bg-muted/50 flex items-center space-x-2 rounded-md border p-2.5 transition-colors'>
                <RadioGroupItem value='current' id='paste-current' />
                <Label
                  htmlFor='paste-current'
                  className='cursor-pointer text-xs font-normal'
                >
                  Current Mode ({editorMode})
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className='bg-muted/30 flex items-center justify-end gap-3 border-t px-6 py-4'>
          <DialogClose asChild>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 text-xs'
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            size='sm'
            className='h-8 text-xs'
            onClick={handleApply}
          >
            Inject Tokens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
