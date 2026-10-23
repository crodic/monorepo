import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '@/stores/auth-store'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { apiSignOut } from '@/pages/auth/queries'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const { logout, meta } = useAuthStore(
    useShallow((s) => ({
      logout: s.logout,
      meta: s.meta,
    }))
  )

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await apiSignOut(meta.refreshToken)
    } catch (_error) {
      // Ignore API sign-out error and clear local session regardless
    } finally {
      logout()
      const currentPath = location.pathname
      navigate(`/sign-in${currentPath ? `?redirect=${currentPath}` : ''}`, {
        replace: true,
      })
      setIsLoading(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('signOut.title')}
      desc={t('signOut.description')}
      confirmText={t('signOut.buttonSignOut')}
      cancelBtnText={t('signOut.buttonCancel')}
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
      isLoading={isLoading}
    />
  )
}
