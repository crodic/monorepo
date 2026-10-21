'use client'

import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import { Download, FileCode, FileSpreadsheet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  exportTableData,
  type ExportFormat,
  type ExportMode,
} from './data-table-export.helper'

export interface DataTableExportProps<TData> {
  table: Table<TData>
  filename?: string
  align?: 'start' | 'center' | 'end'
  className?: string
  disabled?: boolean
}

export function DataTableExport<TData>({
  table,
  filename = 'table-export',
  align = 'end',
  className,
  disabled = false,
}: DataTableExportProps<TData>) {
  const { t } = useTranslation()

  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const filteredCount = table.getFilteredRowModel().rows.length

  const handleExport = React.useCallback(
    (format: ExportFormat, mode: ExportMode) => {
      try {
        const result = exportTableData(table, {
          format,
          mode,
          filename,
        })

        if (result.rowCount === 0) {
          toast.warning(
            t(
              'dataTable.export.noData',
              'No data available to export in the selected range'
            )
          )
          return
        }

        toast.success(
          t('dataTable.export.success', {
            count: result.rowCount,
            defaultValue: `Exported ${result.rowCount} records to ${result.filename}`,
          })
        )
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to export table data'
        )
      }
    },
    [filename, t, table]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('dataTable.export.export', 'Export')}
          variant='outline'
          size='sm'
          className={cn('h-8 font-normal', className)}
          disabled={disabled || filteredCount === 0}
        >
          <Download
            className='text-muted-foreground mr-1.5 size-4'
            aria-hidden='true'
          />
          <span>{t('dataTable.export.export', 'Export')}</span>
          {selectedCount > 0 && (
            <Badge
              variant='secondary'
              className='ml-1.5 px-1.5 py-0 text-[10px] font-semibold'
            >
              {selectedCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className='w-56'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
            {t('dataTable.export.exportAsCsv', 'CSV (Excel)')}
          </DropdownMenuLabel>
          <DropdownMenuItem
            disabled={selectedCount === 0}
            onClick={() => handleExport('csv', 'selected')}
            className='flex items-center justify-between text-xs'
          >
            <span className='flex items-center gap-2'>
              <FileSpreadsheet
                className='text-muted-foreground size-3.5'
                aria-hidden='true'
              />
              <span>
                {t('dataTable.export.selectedRows', {
                  count: selectedCount,
                  defaultValue: `Selected (${selectedCount})`,
                })}
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('csv', 'filtered')}
            className='flex items-center justify-between text-xs'
          >
            <span className='flex items-center gap-2'>
              <FileSpreadsheet
                className='text-muted-foreground size-3.5'
                aria-hidden='true'
              />
              <span>
                {t('dataTable.export.filteredRows', {
                  count: filteredCount,
                  defaultValue: `All filtered (${filteredCount})`,
                })}
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
            {t('dataTable.export.exportAsJson', 'JSON Format')}
          </DropdownMenuLabel>
          <DropdownMenuItem
            disabled={selectedCount === 0}
            onClick={() => handleExport('json', 'selected')}
            className='flex items-center justify-between text-xs'
          >
            <span className='flex items-center gap-2'>
              <FileCode
                className='text-muted-foreground size-3.5'
                aria-hidden='true'
              />
              <span>
                {t('dataTable.export.selectedRows', {
                  count: selectedCount,
                  defaultValue: `Selected (${selectedCount})`,
                })}
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('json', 'filtered')}
            className='flex items-center justify-between text-xs'
          >
            <span className='flex items-center gap-2'>
              <FileCode
                className='text-muted-foreground size-3.5'
                aria-hidden='true'
              />
              <span>
                {t('dataTable.export.filteredRows', {
                  count: filteredCount,
                  defaultValue: `All filtered (${filteredCount})`,
                })}
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
