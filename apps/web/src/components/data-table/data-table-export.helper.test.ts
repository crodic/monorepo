import { describe, expect, it } from 'vitest'
import {
  createExportFilename,
  formatCellValue,
  generateCsvContent,
  generateJsonContent,
  getColumnTitle,
} from './data-table-export.helper'

describe('data-table-export.helper', () => {
  describe('getColumnTitle', () => {
    it('uses string header if present', () => {
      const col = {
        id: 'createdAt',
        columnDef: { header: 'Creation Date' },
      } as any
      expect(getColumnTitle(col)).toBe('Creation Date')
    })

    it('formats camelCase id to Title Case if header is a component or missing', () => {
      const col = {
        id: 'userEmailAddress',
        columnDef: {},
      } as any
      expect(getColumnTitle(col)).toBe('User Email Address')
    })

    it('formats snake_case id to Title Case', () => {
      const col = {
        id: 'is_active_member',
        columnDef: {},
      } as any
      expect(getColumnTitle(col)).toBe('Is active member')
    })
  })

  describe('formatCellValue', () => {
    it('handles null and undefined', () => {
      expect(formatCellValue(null)).toBe('')
      expect(formatCellValue(undefined)).toBe('')
    })

    it('handles booleans', () => {
      expect(formatCellValue(true)).toBe('Yes')
      expect(formatCellValue(false)).toBe('No')
    })

    it('handles dates', () => {
      const date = new Date('2026-10-21T08:00:00.000Z')
      expect(formatCellValue(date)).toBe('2026-10-21T08:00:00.000Z')
    })

    it('handles arrays of primitives and objects', () => {
      expect(formatCellValue(['apple', 'banana'])).toBe('apple; banana')
      expect(formatCellValue([{ name: 'Admin' }, { name: 'Editor' }])).toBe(
        'Admin; Editor'
      )
    })

    it('handles objects with name/title/label', () => {
      expect(formatCellValue({ name: 'United States' })).toBe('United States')
      expect(formatCellValue({ title: 'Manager' })).toBe('Manager')
      expect(formatCellValue({ label: 'Active' })).toBe('Active')
    })
  })

  describe('generateCsvContent', () => {
    it('prefixes with UTF-8 BOM', () => {
      const csv = generateCsvContent(['Name'], [['Alice']])
      expect(csv.startsWith('\uFEFF')).toBe(true)
    })

    it('properly escapes commas, quotes, and newlines', () => {
      const headers = ['Name', 'Bio', 'Role']
      const rows = [
        ['Alice', 'Likes "coding", coffee', 'Admin'],
        ['Bob\nSmith', 'Simple text', 'User'],
      ]
      const csv = generateCsvContent(headers, rows)

      expect(csv).toContain('"Likes ""coding"", coffee"')
      expect(csv).toContain('"Bob\nSmith"')
    })

    it('supports Vietnamese and Unicode characters', () => {
      const headers = ['Họ và Tên', 'Chức Vụ']
      const rows = [['Nguyễn Văn A', 'Quản trị viên']]
      const csv = generateCsvContent(headers, rows)

      expect(csv).toContain('Nguyễn Văn A,Quản trị viên')
    })
  })

  describe('generateJsonContent', () => {
    it('creates formatted JSON', () => {
      const records = [{ id: 1, name: 'Test' }]
      const json = generateJsonContent(records)
      expect(JSON.parse(json)).toEqual(records)
    })
  })

  describe('createExportFilename', () => {
    it('creates timestamped filename', () => {
      const filename = createExportFilename('users list', 'csv')
      expect(filename).toMatch(/^users-list-\d{4}-\d{2}-\d{2}\.csv$/)
    })

    it('sanitizes special characters in filename', () => {
      const filename = createExportFilename('Roles & Permissions/2026', 'json')
      expect(filename).toMatch(
        /^roles---permissions-2026-\d{4}-\d{2}-\d{2}\.json$/
      )
    })
  })
})
