import { useCallback, useMemo } from 'react'
import { PlusIcon } from 'lucide-react'
import { parseAsString } from 'nuqs'
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
import { PageHeader } from '@/components/layout/page-shell'
import { columns as defaultColumns } from './columns'
import { useDataWhiteLabelOverview } from './queries'
import { ColumnKey, type WhiteLabelSchema } from './schema'

const whiteLabelFilterParsers = {
  name: parseAsString,
  slug: parseAsString,
  target: parseAsString,
  isActive: parseAsString,
} as const

export function PageWhiteLabelOverview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ability = useAuthStore((state) => state.ability)

  const columns = useMemo(() => defaultColumns, [])

  const buildQuery: ResourceQueryBuilderFn<typeof whiteLabelFilterParsers> =
    useCallback((builder, filter) => {
      let isActiveValue: boolean | undefined
      if (typeof filter.isActive === 'boolean') {
        isActiveValue = filter.isActive
      } else if (filter.isActive === 'true') {
        isActiveValue = true
      } else if (filter.isActive === 'false') {
        isActiveValue = false
      }

      builder
        .ilike('name', filter.name)
        .ilike('slug', filter.slug)
        .eq('target', filter.target)
        .eq('isActive', isActiveValue)
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
        <PageHeader
          title={t('whiteLabels.overview.title')}
          description={t('whiteLabels.overview.description')}
          actions={
            ability.can('create', 'WHITE_LABEL') ? (
              <Button onClick={() => navigate('/white-labels/create')}>
                <PlusIcon className='size-4' aria-hidden='true' />
                {t('whiteLabels.actions.create')}
              </Button>
            ) : undefined
          }
        />

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
