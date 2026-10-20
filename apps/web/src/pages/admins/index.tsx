import { useCallback, useMemo } from 'react'
import { PlusIcon } from 'lucide-react'
import { parseAsArrayOf, parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useResourceTable } from '@/hooks/use-resource-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-shell'
import { useDataRoleFormOptions } from '../roles/queries'
import { getAdminsTableColumns } from './columns'
import { useDataAdminOverview } from './queries'
import { type AdminSchema, ColumnKey } from './schema'

const adminsFilterParsers = {
  email: parseAsString,
  fullName: parseAsString,
  role: parseAsArrayOf(parseAsString, ','),
} as const

export function PageAdminOverview() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: rolesData } = useDataRoleFormOptions()

  const columns = useMemo(
    () => getAdminsTableColumns({ roles: rolesData }),
    [rolesData]
  )

  const buildQuery = useCallback((builder: any, filter: any) => {
    builder
      .ilike('email', filter.email)
      .ilike('fullName', filter.fullName)
      .in('roles.id', filter.role || [])
  }, [])

  const { table, isFetching } = useResourceTable<
    AdminSchema,
    typeof adminsFilterParsers
  >({
    columns,
    allowedSorts: [ColumnKey.email, ColumnKey.fullName, ColumnKey.verifiedAt],
    filterParsers: adminsFilterParsers,
    queryHook: useDataAdminOverview,
    buildQuery,
    getRowId: (row) => row.id,
  })

  const handleRowClick = (admin: AdminSchema) => {
    navigate(`/admins/${admin.id}/show`)
  }

  return (
    <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
      <PageHeader
        title={t('adminUsers.overview.title')}
        description={t('adminUsers.overview.description')}
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
