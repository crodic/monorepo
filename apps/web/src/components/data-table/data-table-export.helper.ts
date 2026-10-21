import type { Column, Row, Table } from '@tanstack/react-table'

export type ExportMode = 'selected' | 'filtered'
export type ExportFormat = 'csv' | 'json'

export const EXCLUDED_COLUMN_IDS = new Set([
  'select',
  'actions',
  'expander',
  '_select',
  '_actions',
])

/**
 * Returns a readable title for a table column.
 */
export function getColumnTitle<TData>(column: Column<TData, unknown>): string {
  if (typeof column.columnDef.header === 'string') {
    return column.columnDef.header
  }

  // Fallback to capitalised/spaced column ID
  return column.id
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/^./, (str) => str.toUpperCase())
}

/**
 * Filters out selection checkboxes, action buttons, and expander cells.
 */
export function getExportableColumns<TData>(
  table: Table<TData>,
  onlyVisible: boolean = true
): Column<TData, unknown>[] {
  const allColumns = onlyVisible
    ? table.getVisibleLeafColumns()
    : table.getAllLeafColumns()

  return allColumns.filter(
    (column) =>
      !EXCLUDED_COLUMN_IDS.has(column.id) &&
      typeof column.accessorFn !== 'undefined'
  )
}

/**
 * Normalizes cell values into readable text for CSV and JSON outputs.
 */
export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === 'object' && item !== null
          ? (item.name ??
            item.title ??
            item.label ??
            item.id ??
            JSON.stringify(item))
          : String(item)
      )
      .join('; ')
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('name' in obj && typeof obj.name === 'string') return obj.name
    if ('title' in obj && typeof obj.title === 'string') return obj.title
    if ('label' in obj && typeof obj.label === 'string') return obj.label
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Generates RFC-4180 compliant CSV string with UTF-8 BOM.
 */
export function generateCsvContent(
  headers: string[],
  rows: string[][]
): string {
  const escapeCell = (cell: string): string => {
    if (
      cell.includes(',') ||
      cell.includes('"') ||
      cell.includes('\n') ||
      cell.includes('\r')
    ) {
      return `"${cell.replace(/"/g, '""')}"`
    }
    return cell
  }

  const headerLine = headers.map(escapeCell).join(',')
  const rowLines = rows.map((row) => row.map(escapeCell).join(','))

  // \uFEFF is the UTF-8 Byte Order Mark (BOM), ensuring Excel opens Unicode/Vietnamese without mojibake
  return `\uFEFF${[headerLine, ...rowLines].join('\r\n')}`
}

/**
 * Generates formatted JSON content from headers and rows.
 */
export function generateJsonContent(
  records: Record<string, unknown>[]
): string {
  return JSON.stringify(records, null, 2)
}

/**
 * Triggers the browser download dialog for a file blob.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Formats a clean export filename with current date stamp.
 */
export function createExportFilename(
  baseName: string = 'export',
  format: ExportFormat
): string {
  const dateStr = new Date().toISOString().slice(0, 10)
  const cleanBase = baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  return `${cleanBase}-${dateStr}.${format}`
}

/**
 * Core export orchestration: extracts data from TanStack Table and downloads CSV or JSON.
 */
export function exportTableData<TData>(
  table: Table<TData>,
  options: {
    format: ExportFormat
    mode: ExportMode
    filename?: string
    onlyVisibleColumns?: boolean
  }
): { rowCount: number; filename: string } {
  const {
    format,
    mode,
    filename = 'table-export',
    onlyVisibleColumns = true,
  } = options
  const targetRows: Row<TData>[] =
    mode === 'selected'
      ? table.getFilteredSelectedRowModel().rows
      : table.getFilteredRowModel().rows

  const columns = getExportableColumns(table, onlyVisibleColumns)
  const headers = columns.map(getColumnTitle)
  const outputFilename = createExportFilename(filename, format)

  if (format === 'csv') {
    const rows = targetRows.map((row) =>
      columns.map((column) => formatCellValue(row.getValue(column.id)))
    )
    const csv = generateCsvContent(headers, rows)
    downloadFile(csv, outputFilename, 'text/csv')
  } else {
    const records = targetRows.map((row) => {
      const record: Record<string, unknown> = {}
      columns.forEach((column) => {
        const title = getColumnTitle(column)
        record[title] = row.getValue(column.id)
      })
      return record
    })
    const json = generateJsonContent(records)
    downloadFile(json, outputFilename, 'application/json')
  }

  return { rowCount: targetRows.length, filename: outputFilename }
}
