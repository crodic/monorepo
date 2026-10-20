import { useEffect, useRef, useState } from 'react'
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react'
import http from '@/lib/http'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { FileSchema } from '../schema'

export function DocxPreviewViewer({
  file,
  url,
  className,
}: {
  file: FileSchema
  url: string
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    setError(null)

    async function loadDocx() {
      try {
        const response = await http.get(url, { responseType: 'blob' })
        if (isCancelled) return

        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          const { renderAsync } = await import('docx-preview')
          await renderAsync(response.data, containerRef.current, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
          })
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to render DOCX file'
          setError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDocx()

    return () => {
      isCancelled = true
    }
  }, [url])

  return (
    <div
      className={cn(
        'bg-muted/10 relative flex size-full min-h-[520px] flex-col overflow-hidden rounded-xl border',
        className
      )}
    >
      <div className='bg-muted/40 flex items-center justify-between border-b px-4 py-2 text-xs'>
        <div className='flex max-w-sm items-center gap-2 truncate'>
          <FileText className='size-4 text-blue-500' />
          <span className='text-foreground truncate font-medium'>
            {file.original_name}
          </span>
          <span className='rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400'>
            DOCX
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            className='h-7 gap-1 text-xs'
            asChild
          >
            <a href={url} download={file.original_name}>
              <Download className='size-3.5' />
              Download
            </a>
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='h-7 gap-1 text-xs'
            asChild
          >
            <a href={url} target='_blank' rel='noreferrer'>
              <ExternalLink className='size-3.5' />
              Open tab
            </a>
          </Button>
        </div>
      </div>

      <div className='relative flex-1 overflow-auto bg-neutral-200/50 p-4 dark:bg-neutral-900/70'>
        {isLoading && (
          <div className='text-muted-foreground flex h-80 items-center justify-center gap-2 text-sm'>
            <Loader2 className='text-primary size-5 animate-spin' />
            <span>Loading Word document...</span>
          </div>
        )}
        {error && (
          <div className='flex h-80 flex-col items-center justify-center gap-3 p-4 text-center'>
            <p className='text-destructive text-sm font-medium'>{error}</p>
            <Button size='sm' variant='outline' asChild>
              <a href={url} download={file.original_name}>
                <Download className='mr-1.5 size-3.5' />
                Download file to view locally
              </a>
            </Button>
          </div>
        )}
        <div
          ref={containerRef}
          className={cn(
            'docx-preview-wrapper mx-auto max-w-4xl rounded-sm bg-white p-6 text-black shadow-lg dark:bg-neutral-100',
            isLoading || error ? 'hidden' : 'block'
          )}
        />
      </div>
    </div>
  )
}
