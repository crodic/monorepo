import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Table as TableIcon,
  WrapText,
} from 'lucide-react'
import { toast } from 'sonner'
import http from '@/lib/http'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { FileSchema } from '../schema'

export function TextPreviewViewer({
  file,
  url,
  ext,
  className,
}: {
  file: FileSchema
  url: string
  ext: string
  className?: string
}) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wrapLines, setWrapLines] = useState(true)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table')
  const isTabular = ext === 'csv' || ext === 'tsv'

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    setError(null)

    async function loadText() {
      try {
        const response = await http.get<string>(url, { responseType: 'text' })
        if (isCancelled) return
        const raw =
          typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data, null, 2)
        setContent(raw)
      } catch (err: unknown) {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load file content'
          setError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadText()

    return () => {
      isCancelled = true
    }
  }, [url])

  const lines = useMemo(() => {
    if (!content) return []
    return content.split(/\r?\n/)
  }, [content])

  const parsedTable = useMemo(() => {
    if (!isTabular || !content) return null
    const delimiter = ext === 'tsv' ? '\t' : ','
    const rawRows = lines.filter((l) => l.trim().length > 0)
    if (rawRows.length === 0) return null

    const splitRow = (rowStr: string) => {
      const result: string[] = []
      let insideQuote = false
      let current = ''
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i]
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote
        } else if (char === delimiter && !insideQuote) {
          result.push(current.trim().replace(/^["']|["']$/g, ''))
          current = ''
          continue
        }
        current += char
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''))
      return result
    }

    const headers = splitRow(rawRows[0])
    const rows = rawRows.slice(1, 500).map(splitRow)
    return { headers, rows, totalRows: rawRows.length - 1 }
  }, [isTabular, content, lines, ext])

  const handleCopy = async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('File content copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatBadge = ext.toUpperCase() || 'TXT'

  return (
    <div
      className={cn(
        'bg-muted/10 relative flex size-full min-h-[520px] flex-col overflow-hidden rounded-xl border',
        className
      )}
    >
      <div className='bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-xs'>
        <div className='flex max-w-sm items-center gap-2 truncate'>
          {isTabular ? (
            <FileSpreadsheet className='size-4 text-emerald-500' />
          ) : (
            <Code2 className='size-4 text-amber-500' />
          )}
          <span className='text-foreground truncate font-medium'>
            {file.original_name}
          </span>
          <span className='bg-muted text-foreground/80 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold'>
            {formatBadge}
          </span>
          {content !== null && (
            <span className='text-muted-foreground hidden text-[11px] sm:inline'>
              {lines.length} lines
            </span>
          )}
        </div>

        <div className='flex items-center gap-1.5'>
          {isTabular && (
            <div className='bg-muted/70 border-border/60 flex rounded-md border p-0.5'>
              <Button
                type='button'
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size='sm'
                className='h-6 gap-1 px-2 text-[11px]'
                onClick={() => setViewMode('table')}
              >
                <TableIcon className='size-3' />
                Table
              </Button>
              <Button
                type='button'
                variant={viewMode === 'raw' ? 'secondary' : 'ghost'}
                size='sm'
                className='h-6 gap-1 px-2 text-[11px]'
                onClick={() => setViewMode('raw')}
              >
                <Code2 className='size-3' />
                Raw
              </Button>
            </div>
          )}

          {(!isTabular || viewMode === 'raw') && (
            <Button
              type='button'
              size='sm'
              variant={wrapLines ? 'secondary' : 'outline'}
              className='h-7 gap-1 px-2 text-xs'
              onClick={() => setWrapLines((w) => !w)}
              title='Toggle wrap lines'
            >
              <WrapText className='size-3.5' />
              <span className='hidden sm:inline'>Wrap</span>
            </Button>
          )}

          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-7 gap-1 px-2 text-xs'
            onClick={handleCopy}
            disabled={!content}
            title='Copy all content'
          >
            {copied ? (
              <Check className='size-3.5 text-emerald-500' />
            ) : (
              <Copy className='size-3.5' />
            )}
            <span className='hidden sm:inline'>Copy</span>
          </Button>

          <Button
            size='sm'
            variant='outline'
            className='h-7 gap-1 px-2 text-xs'
            asChild
          >
            <a href={url} download={file.original_name}>
              <Download className='size-3.5' />
              <span className='hidden sm:inline'>Download</span>
            </a>
          </Button>

          <Button
            size='sm'
            variant='ghost'
            className='h-7 gap-1 px-2 text-xs'
            asChild
          >
            <a href={url} target='_blank' rel='noreferrer'>
              <ExternalLink className='size-3.5' />
            </a>
          </Button>
        </div>
      </div>

      <div className='bg-card/50 relative flex-1 overflow-auto'>
        {isLoading && (
          <div className='text-muted-foreground flex h-80 items-center justify-center gap-2 text-sm'>
            <Loader2 className='text-primary size-5 animate-spin' />
            <span>Loading content...</span>
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

        {content !== null &&
          isTabular &&
          viewMode === 'table' &&
          parsedTable && (
            <div className='size-full overflow-auto p-2'>
              <div className='border-border/80 overflow-hidden rounded-lg border'>
                <table className='w-full text-left text-xs'>
                  <thead className='bg-muted/70 text-muted-foreground sticky top-0 border-b font-semibold'>
                    <tr>
                      <th className='text-muted-foreground/60 w-12 px-2.5 py-2 text-center'>
                        #
                      </th>
                      {parsedTable.headers.map((h, i) => (
                        <th
                          key={i}
                          className='border-r px-3 py-2 whitespace-nowrap last:border-r-0'
                        >
                          {h || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-border/60 bg-card divide-y font-mono'>
                    {parsedTable.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className='hover:bg-muted/40 transition-colors'
                      >
                        <td className='text-muted-foreground/60 px-2.5 py-1.5 text-center text-[10px] select-none'>
                          {rIdx + 1}
                        </td>
                        {parsedTable.headers.map((_, cIdx) => (
                          <td
                            key={cIdx}
                            className='text-foreground border-r px-3 py-1.5 whitespace-nowrap last:border-r-0'
                          >
                            {row[cIdx] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedTable.totalRows > 500 && (
                <p className='text-muted-foreground mt-2 text-center text-[11px]'>
                  Showing first 500 of {parsedTable.totalRows} rows
                </p>
              )}
            </div>
          )}

        {content !== null && (!isTabular || viewMode === 'raw') && (
          <div className='flex min-h-full font-mono text-xs'>
            <div className='bg-muted/30 border-border/50 text-muted-foreground/50 border-r py-3 pr-3 pl-2.5 text-right select-none'>
              {lines.map((_, i) => (
                <div key={i} className='leading-5'>
                  {i + 1}
                </div>
              ))}
            </div>

            <pre
              className={cn(
                'text-foreground flex-1 p-3 font-mono leading-5',
                wrapLines
                  ? 'break-words whitespace-pre-wrap'
                  : 'overflow-x-auto whitespace-pre'
              )}
            >
              <code>{content}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
