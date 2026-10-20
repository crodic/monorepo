import { useCallback, useMemo } from 'react'
import { PlusIcon } from 'lucide-react'
import { parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { normalizeDate } from '@/lib/utils'
import {
  useResourceTable,
  type ResourceQueryBuilderFn,
} from '@/hooks/use-resource-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-shell'
import { useDataUserOverview } from '../users/queries'
import { ColumnKey, type UserSchema } from '../users/schema'
import { getUsersTableColumns } from './columns'
import { UsersTableActionBar } from './users-table-action-bar'

const userFilterParsers = {
  [ColumnKey.email]: parseAsString,
  [ColumnKey.createdAt]: parseAsArrayOf(parseAsInteger, ','),
  [ColumnKey.fullName]: parseAsString,
  [ColumnKey.id]: parseAsString,
} as const

export function PageUserOverview() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleRowClick = (row: UserSchema) => {
    navigate(`/users/${row.id}/show`)
  }

  const columns = useMemo(() => getUsersTableColumns(), [])

  const buildQuery: ResourceQueryBuilderFn<typeof userFilterParsers> =
    useCallback((builder, filter) => {
      const createdFrom = normalizeDate(filter.createdAt?.[0])
      const createdTo = normalizeDate(filter.createdAt?.[1])
      builder
        .btw('createdAt', createdFrom, createdTo)
        .ilike('email', filter.email)
        .ilike('fullName', filter.fullName)
        .eq('id', filter.id)
    }, [])

  const { table, isFetching } = useResourceTable<
    UserSchema,
    typeof userFilterParsers
  >({
    columns,
    allowedSorts: [ColumnKey.createdAt],
    filterParsers: userFilterParsers,
    queryHook: useDataUserOverview,
    buildQuery,
    getRowId: (originalRow) => originalRow.id,
    clearOnDefault: true,
  })

  return (
    <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
      <PageHeader
        title={t('users.overview.title')}
        actions={
          <Button onClick={() => navigate('create')}>
            <PlusIcon className='size-4' aria-hidden='true' />
            {t('buttons.create')}
          </Button>
        }
      />

      <DataTable
        table={table}
        actionBar={<UsersTableActionBar table={table} />}
        onClickRowAction={handleRowClick}
        isFetching={isFetching}
      >
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align='end' />
        </DataTableToolbar>
      </DataTable>
    </Main>
  )
}
