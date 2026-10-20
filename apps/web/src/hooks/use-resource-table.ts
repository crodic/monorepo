import { useMemo } from 'react'
import type { ColumnDef, Row, Table, TableState } from '@tanstack/react-table'
import type { ExtendedColumnSort } from '@/types/data-table'
import type { SingleParser } from 'nuqs'
import {
  PaginateQueryBuilder,
  type PaginateQueryParams,
} from '@/lib/query-builder'
import { sortParser } from '@/lib/utils'
import { useDataTable } from '@/hooks/use-data-table'
import useGetFilterParams, {
  type InferParsers,
} from '@/hooks/use-get-filter-params'

const DEFAULT_COLUMN_PINNING = { right: ['actions'] }

export type ResourceQueryBuilderFn<
  TParsers extends Record<string, SingleParser<any>> = Record<
    string,
    SingleParser<any>
  >,
> = (
  builder: PaginateQueryBuilder,
  filter: InferParsers<TParsers>,
  search?: string
) => void

export interface UseResourceTableOptions<
  TData,
  TParsers extends Record<string, SingleParser<any>> = Record<
    string,
    SingleParser<any>
  >,
> {
  columns: ColumnDef<TData, any>[]
  allowedSorts?: string[]
  filterParsers?: TParsers
  buildQuery?: ResourceQueryBuilderFn<TParsers>
  queryHook: (params: PaginateQueryParams) => {
    data?: {
      data: TData[]
      meta: { totalPages: number; totalItems?: number; [key: string]: any }
    }
    isFetching: boolean
    [key: string]: any
  }
  initialColumnPinning?: { left?: string[]; right?: string[] }
  initialState?: Omit<Partial<TableState>, 'sorting'> & {
    sorting?: ExtendedColumnSort<TData>[]
  }
  getRowId?: (row: TData) => string
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
  clearOnDefault?: boolean
}

export interface UseResourceTableReturn<
  TData,
  TParsers extends Record<string, SingleParser<any>>,
> {
  table: Table<TData>
  data: TData[]
  meta?: { totalPages: number; totalItems?: number; [key: string]: any }
  isFetching: boolean
  filter: InferParsers<TParsers>
  page: number
  perPage: number
  search: string
  queryParams: PaginateQueryParams
}

/**
 * Deep hook encapsulating URL state (nuqs), query building, sorting translation,
 * and TanStack Table instantiation into a single cohesive interface.
 */
export function useResourceTable<
  TData,
  TParsers extends Record<string, SingleParser<any>> = Record<
    string,
    SingleParser<any>
  >,
>({
  columns,
  allowedSorts = [],
  filterParsers,
  buildQuery,
  queryHook,
  initialColumnPinning = DEFAULT_COLUMN_PINNING,
  initialState,
  getRowId = (row: any) => row.id,
  enableRowSelection,
  clearOnDefault,
}: UseResourceTableOptions<TData, TParsers>): UseResourceTableReturn<
  TData,
  TParsers
> {
  const {
    page,
    perPage,
    sorting: sort,
    filter,
    search,
  } = useGetFilterParams<TData, TParsers>({
    allowedSorts,
    filterParsers: filterParsers ?? ({} as TParsers),
  })

  const queryParams = useMemo(() => {
    const builder = new PaginateQueryBuilder().page(page).limit(perPage)

    if (search) {
      builder.search(search)
    }

    if (buildQuery) {
      buildQuery(builder, filter, search)
    }

    builder.applySorts(sortParser(sort))
    return builder.build()
  }, [page, perPage, filter, sort, search, buildQuery])

  const { data, isFetching } = queryHook(queryParams)
  const totalPages = data?.meta?.totalPages ?? 0

  const { table } = useDataTable({
    data: data?.data ?? [],
    columns,
    pageCount: totalPages,
    initialState: {
      columnPinning: initialColumnPinning,
      ...initialState,
    },
    getRowId,
    enableRowSelection,
    clearOnDefault,
  })

  return {
    table,
    data: data?.data ?? [],
    meta: data?.meta,
    isFetching,
    filter,
    page,
    perPage,
    search,
    queryParams,
  }
}
