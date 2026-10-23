import { useCallback, useMemo } from 'react'
import { parseAsArrayOf, parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  useResourceTable,
  type ResourceQueryBuilderFn,
} from '@/hooks/use-resource-table'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-shell'
import { getActivitiesTableColumns } from './columns'
import { useDataLogOverview } from './queries'
import { type ActivityLogSchema, ColumnKey } from './schema'

const activitiesFilterParsers = {
  entityId: parseAsString.withDefault(''),
  entity: parseAsString.withDefault(''),
  description: parseAsString.withDefault(''),
  action: parseAsArrayOf(parseAsString, ',').withDefault([]),
  userId: parseAsString.withDefault(''),
} as const

export function PageActivityLogOverview() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const columns = useMemo(
    () =>
      getActivitiesTableColumns({
        actions: ['INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE'],
      }),
    []
  )

  const buildQuery: ResourceQueryBuilderFn<typeof activitiesFilterParsers> =
    useCallback((builder, filter) => {
      builder
        .ilike('entityId', filter.entityId)
        .ilike('entity', filter.entity)
        .ilike('description', filter.description)
        .eq('userId', filter.userId)
        .in('action', filter.action || [])
    }, [])

  const { table, isFetching } = useResourceTable<
    ActivityLogSchema,
    typeof activitiesFilterParsers
  >({
    columns,
    allowedSorts: [ColumnKey.entityId, ColumnKey.timestamp],
    filterParsers: activitiesFilterParsers,
    queryHook: useDataLogOverview,
    buildQuery,
    initialColumnPinning: { right: ['actions'] },
    getRowId: (row) => row.id,
  })

  const handleRowClick = (log: ActivityLogSchema) => {
    navigate(`/logs/${log.id}/show`)
  }

  return (
    <>
      <Main fluid className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title={t('activityLogs.overview.title')}
          description={t('activityLogs.overview.description')}
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
    </>
  )
}
