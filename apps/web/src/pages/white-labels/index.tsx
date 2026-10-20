import { useCallback, useMemo } from 'react'
import { PlusIcon } from 'lucide-react'
import { parseAsBoolean, parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import {
  useResourceTable,
  type ResourceQueryBuilderFn,
} from '@/hooks/use-resource-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { Main } from '@/components/layout/main'
import { columns as defaultColumns } from './columns'
import { useDataWhiteLabelOverview } from './queries'
import { ColumnKey, type WhiteLabelSchema } from './schema'

const whiteLabelFilterParsers = {
  name: parseAsString,
  slug: parseAsString,
  target: parseAsString,
  isActive: parseAsBoolean,
} as const

export function PageWhiteLabelOverview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { ability } = useAuthStore()

  const columns = useMemo(() => defaultColumns, [])

  const buildQuery: ResourceQueryBuilderFn<typeof whiteLabelFilterParsers> =
    useCallback((builder, filter) => {
      builder
        .ilike('name', filter.name)
        .ilike('slug', filter.slug)
        .eq('target', filter.target)
        .eq('isActive', filter.isActive)
    }, [])

  const { table, isFetching } = useResourceTable<
    WhiteLabelSchema,
    typeof whiteLabelFilterParsers
  >({
    allowedSorts: [
      ColumnKey.name,
      ColumnKey.target,
      ColumnKey.isActive,
      ColumnKey.updatedAt,
    ],
    filterParsers: whiteLabelFilterParsers,
    queryHook: useDataWhiteLabelOverview,
    buildQuery,
    columns,
    initialColumnPinning: { right: ['actions'] },
    getRowId: (row) => row.id,
  })

  return (
    <>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('whiteLabels.overview.title')}
            </h2>
            <p className='text-muted-foreground'>
              {t('whiteLabels.overview.description')}
            </p>
          </div>
          {ability.can('create', 'WHITE_LABEL') && (
            <Button onClick={() => navigate('/white-labels/create')}>
              <PlusIcon className='size-4' />
              {t('whiteLabels.actions.create')}
            </Button>
          )}
        </div>

        <DataTable
          table={table}
          onClickRowAction={(row) => navigate(`/white-labels/${row.id}/show`)}
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
