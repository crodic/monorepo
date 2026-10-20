import { describe, expect, it } from 'vitest'
import {
  filterPermissionsByKeyword,
  formatSubjectLabel,
  getFallbackPermissionDetails,
  getPermissionAction,
  groupPermissions,
  isSuperAdminPermissions,
  parsePermissionKey,
  validateAssignablePermissionIds,
} from './permission-matrix.helper'

describe('permission-matrix.helper', () => {
  describe('parsePermissionKey', () => {
    it('correctly splits action and subject', () => {
      expect(parsePermissionKey('read:user')).toEqual({
        action: 'read',
        subject: 'user',
      })
      expect(parsePermissionKey('manage:all')).toEqual({
        action: 'manage',
        subject: 'all',
      })
    })

    it('handles keys without colon gracefully', () => {
      expect(parsePermissionKey('admin')).toEqual({
        action: 'admin',
        subject: 'other',
      })
    })
  })

  describe('getPermissionAction', () => {
    it('extracts action string', () => {
      expect(getPermissionAction('create:file')).toBe('create')
      expect(getPermissionAction('delete:user')).toBe('delete')
    })
  })

  describe('formatSubjectLabel', () => {
    it('formats snake_case into Title Case', () => {
      expect(formatSubjectLabel('admin_user')).toBe('Admin User')
      expect(formatSubjectLabel('white_label')).toBe('White Label')
      expect(formatSubjectLabel('files')).toBe('Files')
    })
  })

  describe('isSuperAdminPermissions', () => {
    it('returns true when manage:all is present as string', () => {
      expect(
        isSuperAdminPermissions(['read:user', 'manage:all', 'create:role'])
      ).toBe(true)
    })

    it('returns true when manage:all is present in object with key', () => {
      expect(
        isSuperAdminPermissions([{ key: 'read:user' }, { key: 'manage:all' }])
      ).toBe(true)
    })

    it('returns false when manage:all is not present', () => {
      expect(isSuperAdminPermissions(['read:user', 'update:user'])).toBe(false)
      expect(isSuperAdminPermissions([])).toBe(false)
      expect(isSuperAdminPermissions(null)).toBe(false)
    })
  })

  describe('getFallbackPermissionDetails', () => {
    it('constructs structured permission details with formatted group', () => {
      const result = getFallbackPermissionDetails([
        'read:user',
        'create:admin_role',
      ])
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'read:user',
        key: 'read:user',
        name: 'read:user',
        group: 'User',
        description: null,
      })
      expect(result[1]).toEqual({
        id: 'create:admin_role',
        key: 'create:admin_role',
        name: 'create:admin_role',
        group: 'Admin Role',
        description: null,
      })
    })
  })

  describe('groupPermissions', () => {
    it('groups by explicit group property if provided', () => {
      const permissions = [
        { key: 'read:user', group: 'Users Domain' },
        { key: 'create:user', group: 'Users Domain' },
        { key: 'read:role', group: 'Roles Domain' },
      ]
      const grouped = groupPermissions(permissions)
      expect(Object.keys(grouped)).toEqual(['Users Domain', 'Roles Domain'])
      expect(grouped['Users Domain']).toHaveLength(2)
      expect(grouped['Roles Domain']).toHaveLength(1)
    })

    it('falls back to formatted subject when group is missing', () => {
      const permissions = [
        { key: 'read:white_label', group: '' },
        { key: 'update:white_label', group: null },
      ]
      const grouped = groupPermissions(permissions)
      expect(grouped['White Label']).toHaveLength(2)
    })
  })

  describe('validateAssignablePermissionIds', () => {
    it('validates selected IDs against assignable IDs', () => {
      const assignable = new Set(['1', '2', '3'])
      expect(validateAssignablePermissionIds(['1', '2'], assignable)).toBe(true)
      expect(validateAssignablePermissionIds(['1', '4'], assignable)).toBe(
        false
      )
      expect(validateAssignablePermissionIds([], assignable)).toBe(true)
    })
  })

  describe('filterPermissionsByKeyword', () => {
    const list = [
      {
        key: 'read:user',
        name: 'Read Users',
        group: 'User Management',
        description: 'Can read user list',
      },
      {
        key: 'write:file',
        name: 'Upload Files',
        group: 'Storage',
        description: null,
      },
    ]

    it('returns all items when keyword is empty', () => {
      expect(filterPermissionsByKeyword(list, '')).toHaveLength(2)
      expect(filterPermissionsByKeyword(list, '   ')).toHaveLength(2)
    })

    it('matches across key, name, group, and description', () => {
      expect(filterPermissionsByKeyword(list, 'user')).toHaveLength(1)
      expect(filterPermissionsByKeyword(list, 'storage')).toHaveLength(1)
      expect(filterPermissionsByKeyword(list, 'upload')).toHaveLength(1)
      expect(filterPermissionsByKeyword(list, 'nonexistent')).toHaveLength(0)
    })
  })
})
