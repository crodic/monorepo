import { z } from 'zod'
import type { ExtendedColumnSort } from '@/types/data-table'
import { createParser } from 'nuqs/server'

const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
})

function toValidKeysSet(
  columnIds?: string[] | Set<string>
): Set<string> | null {
  if (!columnIds) return null
  return columnIds instanceof Set ? columnIds : new Set(columnIds)
}

export const getSortingStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  const validKeys = toValidKeysSet(columnIds)

  return createParser({
    parse: (value) => {
      try {
        const parsed = JSON.parse(value)
        const result = z.array(sortingItemSchema).safeParse(parsed)

        if (!result.success) return null

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedColumnSort<TData>[]
      } catch {
        return null
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (item, index) =>
          item.id === b[index]?.id && item.desc === b[index]?.desc
      ),
  })
}
