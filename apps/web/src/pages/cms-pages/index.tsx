import { useCallback, useMemo } from 'react'
import { PlusIcon } from 'lucide-react'
import { parseAsString } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
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
import { getCmsPagesTableColumns } from './columns'
import { useDataCmsPageOverview } from './queries'
import { ColumnKey, type CmsPageSchema } from './schema'

const pageFilterParsers = {
  title: parseAsString,
  slug: parseAsString,
  status: parseAsString,
} as const

export function PageCmsPageOverview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const columns = useMemo(() => getCmsPagesTableColumns(), [])

  const buildQuery: ResourceQueryBuilderFn<typeof pageFilterParsers> =
    useCallback((builder, filter) => {
      builder
        .ilike('title', filter.title)
        .ilike('slug', filter.slug)
        .eq('status', filter.status)
    }, [])

  const { table, isFetching } = useResourceTable<
    CmsPageSchema,
    typeof pageFilterParsers
  >({
    columns,
    allowedSorts: [
      ColumnKey.title,
      ColumnKey.slug,
      ColumnKey.status,
      ColumnKey.updatedAt,
    ],
    filterParsers: pageFilterParsers,
    queryHook: useDataCmsPageOverview,
    buildQuery,
    getRowId: (row) => row.id,
  })

  return (
    <>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title={t('cmsPages.overview.title')}
          description={t('cmsPages.overview.description')}
          actions={
            <Button onClick={() => navigate('create')}>
              <PlusIcon className='size-4' aria-hidden='true' />
              {t('buttons.create')}
            </Button>
          }
        />
        <DataTable
          table={table}
          isFetching={isFetching}
          onClickRowAction={(row) => {
            if (row.id.startsWith('group-')) {
              return
            }
            const actualId = row.id.startsWith('sub-')
              ? row.id.replace('sub-', '')
              : row.id
            navigate(`/cms-pages/${actualId}/show`)
          }}
        >
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} />
          </DataTableToolbar>
        </DataTable>
      </Main>
    </>
  )
}
