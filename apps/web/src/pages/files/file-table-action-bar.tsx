'use client'

import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import { Download, RotateCcw, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from '@/components/ui/action-bar'
import { type FileSchema } from './schema'

interface FilesTableActionBarBarProps {
  table: Table<FileSchema>
  onDelete: (files: FileSchema[]) => void
  onRestore?: (files: FileSchema[]) => void
  onPermanentDelete?: (files: FileSchema[]) => void
  onBulkDownload?: (files: FileSchema[]) => void
  isTrash?: boolean
  disabled?: boolean
}

export function FilesTableActionBar({
  table,
  onDelete,
  onRestore,
  onPermanentDelete,
  onBulkDownload,
  isTrash = false,
  disabled = false,
}: FilesTableActionBarBarProps) {
  const { t } = useTranslation()
  const rows = table.getFilteredSelectedRowModel().rows

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false)
      }
    },
    [table]
  )

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      <ActionBarSelection>
        <span className='font-medium tabular-nums'>{rows.length}</span>
        <span>{t('files.table.selected', 'selected')}</span>
        <ActionBarSeparator />
        <ActionBarClose
          aria-label={t('common.clearSelection', 'Clear selection')}
        >
          <X aria-hidden='true' />
        </ActionBarClose>
      </ActionBarSelection>
      <ActionBarSeparator />
      <ActionBarGroup>
        {onBulkDownload && !isTrash && (
          <ActionBarItem
            onClick={() => onBulkDownload(rows.map((row) => row.original))}
            disabled={disabled}
          >
            <Download aria-hidden='true' />
            {t('files.actions.download', 'Download')}
          </ActionBarItem>
        )}

        {isTrash ? (
          <>
            {onRestore && (
              <ActionBarItem
                onClick={() => onRestore(rows.map((row) => row.original))}
                disabled={disabled}
              >
                <RotateCcw aria-hidden='true' />
                {t('files.actions.restore', 'Restore')}
              </ActionBarItem>
            )}
            {onPermanentDelete && (
              <ActionBarItem
                variant='destructive'
                onClick={() =>
                  onPermanentDelete(rows.map((row) => row.original))
                }
                disabled={disabled}
              >
                <Trash2 aria-hidden='true' />
                {t('files.actions.permanentDelete', 'Delete permanently')}
              </ActionBarItem>
            )}
          </>
        ) : (
          <ActionBarItem
            variant='destructive'
            onClick={() => onDelete(rows.map((row) => row.original))}
            disabled={disabled}
          >
            <Trash2 aria-hidden='true' />
            {t('files.actions.delete', 'Delete')}
          </ActionBarItem>
        )}
      </ActionBarGroup>
    </ActionBar>
  )
}
