import { Download, ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatBytes } from '../columns'
import type { FileSchema } from '../schema'
import { DocxPreviewViewer } from './docx-preview-viewer'
import {
  getFileExtension,
  isDocxDocument,
  isPdfDocument,
  isTextDocument,
} from './preview-utils'
import { TextPreviewViewer } from './text-preview-viewer'

export function DocumentPreviewViewer({
  file,
  url,
  className,
}: {
  file: FileSchema
  url?: string
  className?: string
}) {
  const { t } = useTranslation()
  const previewUrl = url ?? file.url
  const ext = getFileExtension(file.original_name || file.url).toLowerCase()

  if (isPdfDocument(file, ext)) {
    return (
      <div
        className={cn(
          'bg-muted/10 relative flex size-full min-h-[500px] flex-col overflow-hidden rounded-xl border',
          className
        )}
      >
        <div className='bg-muted/40 flex items-center justify-between border-b px-4 py-2 text-xs'>
          <span className='text-foreground max-w-sm truncate font-medium'>
            {file.original_name}
          </span>
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='h-7 gap-1 text-xs'
              asChild
            >
              <a href={previewUrl} download={file.original_name}>
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
              <a href={previewUrl} target='_blank' rel='noreferrer'>
                <ExternalLink className='size-3.5' />
                Open tab
              </a>
            </Button>
          </div>
        </div>
        <iframe
          src={`${previewUrl}#toolbar=1`}
          className='size-full min-h-[500px] flex-1 border-0'
          title={file.original_name}
        />
      </div>
    )
  }

  if (isDocxDocument(file, ext)) {
    return (
      <DocxPreviewViewer file={file} url={previewUrl} className={className} />
    )
  }

  const isLegacyDoc = ext === 'doc' || file.mime === 'application/msword'
  if (isLegacyDoc) {
    return (
      <div
        className={cn(
          'border-border/80 bg-muted/20 flex size-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center',
          className
        )}
      >
        <div className='mb-4 flex size-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-sm ring-1 ring-amber-500/20 dark:text-amber-400'>
          <FileText className='size-10' />
        </div>
        <div className='mb-2 flex items-center gap-2'>
          <h4 className='text-foreground max-w-md truncate text-base font-semibold'>
            {file.original_name}
          </h4>
          <span className='rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400'>
            Word 97-2003 (.doc)
          </span>
        </div>
        <div className='mb-6 max-w-md rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-xs leading-relaxed text-amber-800 dark:text-amber-200'>
          <p className='mb-1 font-semibold'>
            {t(
              'files.preview.docNotSupportedTitle',
              'Định dạng Word cũ (.doc) không hỗ trợ xem trước trực tiếp'
            )}
          </p>
          <p className='text-muted-foreground dark:text-amber-200/80'>
            {t(
              'files.preview.docNotSupportedDesc',
              'Trình xem trước trên trình duyệt chỉ hỗ trợ định dạng Word hiện đại (.docx). Vui lòng tải về để mở trong Microsoft Word hoặc lưu lại sang định dạng .docx.'
            )}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button size='sm' asChild>
            <a href={previewUrl} download={file.original_name}>
              <Download className='mr-1.5 size-4' />
              {t('files.actions.download', 'Download')}
            </a>
          </Button>
          <Button size='sm' variant='outline' asChild>
            <a href={previewUrl} target='_blank' rel='noreferrer'>
              <ExternalLink className='mr-1.5 size-4' />
              {t('files.actions.open', 'Open file')}
            </a>
          </Button>
        </div>
      </div>
    )
  }

  if (isTextDocument(file, ext)) {
    return (
      <TextPreviewViewer
        file={file}
        url={previewUrl}
        ext={ext}
        className={className}
      />
    )
  }

  return (
    <div
      className={cn(
        'border-border/80 bg-muted/20 flex size-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center',
        className
      )}
    >
      <div className='bg-primary/10 text-primary ring-primary/20 mb-4 flex size-20 items-center justify-center rounded-2xl shadow-sm ring-1'>
        <FileText className='size-10' />
      </div>
      <h4 className='text-foreground mb-1 max-w-md truncate text-base font-semibold'>
        {file.original_name}
      </h4>
      <p className='text-muted-foreground mb-6 text-xs tracking-wider uppercase'>
        {file.mime} • {formatBytes(file.size)}
      </p>
      <div className='flex items-center gap-3'>
        <Button size='sm' asChild>
          <a href={previewUrl} download={file.original_name}>
            <Download className='mr-1.5 size-4' />
            Download file
          </a>
        </Button>
        <Button size='sm' variant='outline' asChild>
          <a href={previewUrl} target='_blank' rel='noreferrer'>
            <ExternalLink className='mr-1.5 size-4' />
            Open in browser
          </a>
        </Button>
      </div>
    </div>
  )
}
