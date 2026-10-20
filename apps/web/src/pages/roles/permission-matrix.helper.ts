export interface RolePermissionDetail {
  id: string
  key: string
  name: string
  group: string
  description?: string | null
}

export interface ParsedPermissionKey {
  action: string
  subject: string
}

/**
 * Parses a permission key formatted as `action:subject` (e.g., 'read:user' or 'manage:all').
 */
export function parsePermissionKey(permissionKey: string): ParsedPermissionKey {
  const parts = permissionKey.split(':')
  return {
    action: parts[0] || permissionKey,
    subject: parts[1] || 'other',
  }
}

/**
 * Extracts only the action verb from a permission key.
 */
export function getPermissionAction(permissionKey: string): string {
  return parsePermissionKey(permissionKey).action
}

/**
 * Formats a subject token into human-readable Title Case (e.g., 'admin_user' -> 'Admin User').
 */
export function formatSubjectLabel(subject: string): string {
  return subject
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Checks whether a collection of permissions grants full system access (e.g. manage:all).
 */
export function isSuperAdminPermissions(
  permissions?: Array<string | { key: string }> | null
): boolean {
  if (!permissions || permissions.length === 0) return false

  return permissions.some((item) => {
    const key = typeof item === 'string' ? item : item.key
    const { action, subject } = parsePermissionKey(key)
    return action === 'manage' && subject === 'all'
  })
}

/**
 * Creates fallback permission detail items when only raw string permission keys are available.
 */
export function getFallbackPermissionDetails(
  permissions: string[]
): RolePermissionDetail[] {
  return permissions.map((permission) => {
    const { subject } = parsePermissionKey(permission)
    return {
      id: permission,
      key: permission,
      name: permission,
      group: subject !== 'other' ? formatSubjectLabel(subject) : 'Other',
      description: null,
    }
  })
}

/**
 * Groups permissions by their explicit `group` name, falling back to parsed subject or 'Other'.
 */
export function groupPermissions<
  T extends { group?: string | null; key: string },
>(permissions: T[]): Record<string, T[]> {
  return permissions.reduce<Record<string, T[]>>((groups, permission) => {
    const group =
      permission.group ||
      (permission.key.includes(':')
        ? formatSubjectLabel(parsePermissionKey(permission.key).subject)
        : 'Other')

    groups[group] = [...(groups[group] ?? []), permission]
    return groups
  }, {})
}

/**
 * Validates that all selected permission IDs exist within the assignable permissions set.
 */
export function validateAssignablePermissionIds(
  selectedIds: string[],
  assignableIds: Set<string> | string[]
): boolean {
  const idSet =
    assignableIds instanceof Set ? assignableIds : new Set(assignableIds)
  return selectedIds.every((id) => idSet.has(id))
}

/**
 * Filters a list of permissions matching search keyword across key, name, group, and description.
 */
export function filterPermissionsByKeyword<
  T extends {
    key: string
    name: string
    group?: string | null
    description?: string | null
  },
>(permissions: T[], keyword: string): T[] {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) return permissions

  return permissions.filter((permission) =>
    [permission.key, permission.name, permission.group, permission.description]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedKeyword))
  )
}
