import { useCallback, useMemo } from 'react'
import { PlusIcon } from 'lucide-react'
import { parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useResourceTable } from '@/hooks/use-resource-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-shell'
import { getRolesTableColumns } from './columns'
import { useDataRoleOverview } from './queries'
import { ColumnKey, type RoleSchema } from './schema'

const rolesFilterParsers = {
  name: parseAsString,
} as const

export function PageRoleOverview() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const columns = useMemo(() => getRolesTableColumns(), [])

  const buildQuery = useCallback((builder: any, filter: any) => {
    builder.ilike('name', filter.name)
  }, [])

  const { table, isFetching } = useResourceTable<
    RoleSchema,
    typeof rolesFilterParsers
  >({
    allowedSorts: [ColumnKey.name, ColumnKey.createdAt],
    filterParsers: rolesFilterParsers,
    queryHook: useDataRoleOverview,
    buildQuery,
    columns,
    initialColumnPinning: { right: ['actions'] },
    getRowId: (row) => row.id,
  })

  const handleRowClick = (role: RoleSchema) => {
    navigate(`/roles/${role.id}/show`)
  }

  return (
    <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
      <PageHeader
        title={t('roles.overview.title')}
        description={t('roles.overview.description')}
        actions={
          <Button onClick={() => navigate('create')}>
            <PlusIcon className='size-4' aria-hidden='true' />
            {t('buttons.create')}
          </Button>
        }
      />
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
  )
}
