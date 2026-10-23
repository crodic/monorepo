import { type ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { type Subjects, type Actions } from '@/lib/permissions'

interface Props {
  action: Actions
  subject: Subjects
  children: ReactNode
  fallback?: ReactNode
}

export function Authorize({
  action,
  subject,
  children,
  fallback = null,
}: Props) {
  const { ability } = useAuthStore()

  const isAuthorized = ability.can(action, subject)

  if (!isAuthorized) {
    return fallback
  }

  return children
}
