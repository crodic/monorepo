import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import type { Actions, Subjects } from '@/lib/permissions'

interface RouteAuthorizeProps {
  children: ReactNode
  action?: Actions
  subject?: Subjects
  fallback?: ReactNode
  redirectTo?: string
  requireAuth?: boolean
  isAnyPermission?: boolean
  requireSuperAdmin?: boolean
}

function checkRoutePermission({
  requireSuperAdmin,
  isAnyPermission,
  action,
  subject,
  permissions,
  can,
}: {
  requireSuperAdmin: boolean
  isAnyPermission: boolean
  action?: Actions
  subject?: Subjects
  permissions: string[]
  can: (action: Actions, subject: Subjects) => boolean
}): boolean {
  if (requireSuperAdmin) {
    return permissions.includes('manage:all')
  }
  if (isAnyPermission) {
    return permissions.length > 0
  }
  if (action && subject) {
    return can(action, subject)
  }
  return true
}

export const RouteAuthorize: React.FC<RouteAuthorizeProps> = ({
  children,
  action,
  subject,
  fallback,
  redirectTo = '/errors/forbidden',
  isAnyPermission = false,
  requireSuperAdmin = false,
}) => {
  const { ability, permissions } = useAuthStore()

  const isAllowed = checkRoutePermission({
    requireSuperAdmin,
    isAnyPermission,
    action,
    subject,
    permissions,
    can: (act, subj) => ability.can(act, subj),
  })

  if (!isAllowed) {
    if (fallback) return <>{fallback}</>
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
