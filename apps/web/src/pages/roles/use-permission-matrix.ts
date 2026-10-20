import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  isAssignableRolePermission,
  type PermissionSchema,
} from '@/pages/permissions/schema'
import {
  filterPermissionsByKeyword,
  groupPermissions,
} from './permission-matrix.helper'

export interface UsePermissionMatrixOptions {
  permissions: PermissionSchema[]
  selectedPermissionIds: string[]
  onPermissionIdsChange: (permissionIds: string[]) => void
  isLoading?: boolean
  isError?: boolean
}

export function usePermissionMatrix({
  permissions,
  selectedPermissionIds,
  onPermissionIdsChange,
  isLoading = false,
  isError = false,
}: UsePermissionMatrixOptions) {
  const [searchValue, setSearchValue] = useState('')

  const assignablePermissions = useMemo(() => {
    const assignable = permissions.filter(isAssignableRolePermission)
    return filterPermissionsByKeyword(assignable, searchValue)
  }, [permissions, searchValue])

  const assignablePermissionIds = useMemo(
    () =>
      new Set(
        permissions
          .filter(isAssignableRolePermission)
          .map((permission) => permission.id)
      ),
    [permissions]
  )

  useEffect(() => {
    if (isLoading || isError || permissions.length === 0) {
      return
    }

    const nextPermissionIds = selectedPermissionIds.filter((permissionId) =>
      assignablePermissionIds.has(permissionId)
    )

    if (nextPermissionIds.length !== selectedPermissionIds.length) {
      onPermissionIdsChange(nextPermissionIds)
    }
  }, [
    assignablePermissionIds,
    isError,
    isLoading,
    permissions.length,
    selectedPermissionIds,
    onPermissionIdsChange,
  ])

  const groupedPermissions = useMemo(() => {
    return groupPermissions(assignablePermissions)
  }, [assignablePermissions])

  const toggleGroup = useCallback(
    (group: string, checked: boolean) => {
      const groupPermissionIds =
        groupedPermissions[group]?.map((permission) => permission.id) ?? []
      const current = new Set(selectedPermissionIds)

      groupPermissionIds.forEach((permissionId) => {
        if (checked) {
          current.add(permissionId)
        } else {
          current.delete(permissionId)
        }
      })

      onPermissionIdsChange(Array.from(current))
    },
    [groupedPermissions, onPermissionIdsChange, selectedPermissionIds]
  )

  const togglePermission = useCallback(
    (permissionId: string, checked: boolean) => {
      const current = new Set(selectedPermissionIds)

      if (checked) {
        current.add(permissionId)
      } else {
        current.delete(permissionId)
      }

      onPermissionIdsChange(Array.from(current))
    },
    [onPermissionIdsChange, selectedPermissionIds]
  )

  const isGroupChecked = useCallback(
    (group: string) => {
      const groupPermissionIds =
        groupedPermissions[group]?.map((permission) => permission.id) ?? []

      return (
        groupPermissionIds.length > 0 &&
        groupPermissionIds.every((permissionId) =>
          selectedPermissionIds.includes(permissionId)
        )
      )
    },
    [groupedPermissions, selectedPermissionIds]
  )

  const isGroupIndeterminate = useCallback(
    (group: string) => {
      const groupPermissionIds =
        groupedPermissions[group]?.map((permission) => permission.id) ?? []

      if (groupPermissionIds.length === 0) return false

      const checkedCount = groupPermissionIds.filter((permissionId) =>
        selectedPermissionIds.includes(permissionId)
      ).length

      return checkedCount > 0 && checkedCount < groupPermissionIds.length
    },
    [groupedPermissions, selectedPermissionIds]
  )

  const isPermissionChecked = useCallback(
    (permissionId: string) => {
      return selectedPermissionIds.includes(permissionId)
    },
    [selectedPermissionIds]
  )

  const selectAll = useCallback(() => {
    onPermissionIdsChange(Array.from(assignablePermissionIds))
  }, [assignablePermissionIds, onPermissionIdsChange])

  const deselectAll = useCallback(() => {
    onPermissionIdsChange([])
  }, [onPermissionIdsChange])

  return {
    searchValue,
    setSearchValue,
    assignablePermissions,
    assignablePermissionIds,
    groupedPermissions,
    selectedCount: selectedPermissionIds.length,
    availableCount: assignablePermissionIds.size,
    isGroupChecked,
    isGroupIndeterminate,
    isPermissionChecked,
    toggleGroup,
    togglePermission,
    selectAll,
    deselectAll,
  }
}
