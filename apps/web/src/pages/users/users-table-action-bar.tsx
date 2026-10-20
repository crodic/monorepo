'use client'

import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import { Download, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { exportTableToCSV } from '@/lib/export'
import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from '@/components/ui/action-bar'
import { type UserSchema } from '../users/schema'

interface UserTableActionBarProps {
  table: Table<UserSchema>
}

export function UsersTableActionBar({ table }: UserTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false)
      }
    },
    [table]
  )

  const onTaskExport = React.useCallback(() => {
    exportTableToCSV(table, {
      excludeColumns: ['select', 'actions'],
      onlySelected: true,
    })
  }, [table])

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      <ActionBarSelection>
        <span className='font-medium tabular-nums'>{rows.length}</span>
        <span>selected</span>
        <ActionBarSeparator />
        <ActionBarClose aria-label='Clear selection'>
          <X aria-hidden='true' />
        </ActionBarClose>
      </ActionBarSelection>
      <ActionBarSeparator />
      <ActionBarGroup>
        <ActionBarItem onClick={onTaskExport}>
          <Download aria-hidden='true' />
          Export
        </ActionBarItem>
        <ActionBarItem variant='destructive' onClick={() => toast('Delete...')}>
          <Trash2 aria-hidden='true' />
          Delete
        </ActionBarItem>
      </ActionBarGroup>
    </ActionBar>
  )
}
