import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2Icon, Trash2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { restApiErrorHandler } from '@/lib/rest-api-handler'
import { Button } from '@/components/ui/button'
import { DeleteAlertDialog } from '@/components/common/delete-alert-dialog'
import { apiDeleteRole } from './queries'
import { isProtectedRole, type RoleSchema } from './schema'

export default function ComponentTableRowActions({
  row,
}: {
  row: { original: RoleSchema }
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isShowDeleteDialog, setIsShowDeleteDialog] = useState(false)

  const deleteRoleMutation = useMutation({
    mutationFn: apiDeleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['roles'],
      })
      toast.success('Role deleted successfully')
      setIsShowDeleteDialog(false)
    },
    onError: restApiErrorHandler,
  })

  const handleDelete = () => {
    if (isProtectedRole(row.original)) {
      toast.error('System roles cannot be deleted')
      return
    }

    deleteRoleMutation.mutate(row.original.id)
  }

  const isProtected = isProtectedRole(row.original)

  return (
    <div className='flex items-center gap-1'>
      {isShowDeleteDialog && (
        <DeleteAlertDialog
          open={isShowDeleteDialog}
          onOpenChange={(open) => setIsShowDeleteDialog(open)}
          handleDelete={handleDelete}
          isLoading={deleteRoleMutation.isPending}
        />
      )}
      <Button
        variant='ghost'
        size='icon'
        aria-label='Edit role'
        onClick={() => {
          navigate(`/roles/${row.original.id}/edit`)
        }}
        disabled={isProtected}
      >
        <Edit2Icon className='text-primary size-4' aria-hidden='true' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        aria-label='Delete role'
        onClick={() => setIsShowDeleteDialog(true)}
        disabled={isProtected}
      >
        <Trash2Icon className='text-destructive size-4' aria-hidden='true' />
      </Button>
    </div>
  )
}
