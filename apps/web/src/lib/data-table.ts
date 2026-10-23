import type { Column } from '@tanstack/react-table'

function getPinnedBoxShadow(
  withBorder: boolean,
  isLastLeftPinnedColumn: boolean,
  isFirstRightPinnedColumn: boolean
): string | undefined {
  if (!withBorder) return undefined
  if (isLastLeftPinnedColumn) return '-4px 0 4px -4px var(--border) inset'
  if (isFirstRightPinnedColumn) return '4px 0 4px -4px var(--border) inset'
  return undefined
}

export function getCommonPinningStyles<TData>({
  column,
  withBorder = false,
}: {
  column: Column<TData>
  withBorder?: boolean
}): React.CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow: getPinnedBoxShadow(
      withBorder,
      isLastLeftPinnedColumn,
      isFirstRightPinnedColumn
    ),
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? 'sticky' : 'relative',
    background: isPinned ? 'var(--background)' : undefined,
    width: column.getSize(),
    zIndex: isPinned ? 1 : undefined,
  }
}
