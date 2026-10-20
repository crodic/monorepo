import { useCallback, useMemo } from 'react'
import { parseAsString } from 'nuqs'
import { useNavigate } from 'react-router'
import {
  useResourceTable,
  type ResourceQueryBuilderFn,
} from '@/hooks/use-resource-table'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Main } from '@/components/layout/main'
import { getPermissionsTableColumns } from './columns'
import { useDataPermissionOverview } from './queries'
import { ColumnKey, type PermissionSchema } from './schema'

const permissionFilterParsers = {
  name: parseAsString,
  group: parseAsString,
} as const

export function PagePermissionOverview() {
  const navigate = useNavigate()
  const columns = useMemo(() => getPermissionsTableColumns(), [])

  const buildQuery: ResourceQueryBuilderFn<typeof permissionFilterParsers> =
    useCallback((builder, filter) => {
      builder.ilike('name', filter.name).ilike('group', filter.group)
    }, [])

  const { table, isFetching } = useResourceTable<
    PermissionSchema,
    typeof permissionFilterParsers
  >({
    columns,
    allowedSorts: [ColumnKey.name, ColumnKey.group, ColumnKey.updatedAt],
    filterParsers: permissionFilterParsers,
    queryHook: useDataPermissionOverview,
    buildQuery,
    initialColumnPinning: { right: ['actions'] },
    getRowId: (row) => row.id,
  })

  const handleRowClick = (permission: PermissionSchema) => {
    navigate(`/permissions/${permission.id}/show`)
  }

  return (
    <>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Permissions</h2>
          <p className='text-muted-foreground'>
            Review permission keys and maintain display metadata.
          </p>
        </div>
        <DataTable
          table={table}
          onClickRowAction={handleRowClick}
          isFetching={isFetching}
        >
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} />
          </DataTableToolbar>
        </DataTable>
      </Main>
    </>
  )
}
