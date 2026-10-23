import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2Icon, Trash2Icon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { restApiErrorHandler } from '@/lib/rest-api-handler'
import { Button } from '@/components/ui/button'
import { DeleteAlertDialog } from '@/components/common/delete-alert-dialog'
import { apiDeleteUser } from '../users/queries'
import { type UserSchema } from '../users/schema'

export default function ComponentTableRowActions({
  row,
}: {
  row: { original: UserSchema }
}) {
  const queryClient = useQueryClient()
  const [isShowDeleteDialog, setIsShowDeleteDialog] = useState(false)

  const deleteUserMutation = useMutation({
    mutationFn: apiDeleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      })
      toast.success('User deleted successfully')
      setIsShowDeleteDialog(false)
    },
    onError: restApiErrorHandler,
  })

  const handleDelete = (id: string) => {
    deleteUserMutation.mutate(id)
  }

  return (
    <div className='flex items-center gap-1'>
      {isShowDeleteDialog && (
        <DeleteAlertDialog
          open={isShowDeleteDialog}
          onOpenChange={(open) => setIsShowDeleteDialog(open)}
          handleDelete={() => handleDelete(row.original.id)}
          isLoading={deleteUserMutation.isPending}
        />
      )}

      <Button variant='ghost' size='icon' asChild>
        <Link to={`/users/${row.original.id}/edit`} aria-label='Edit user'>
          <Edit2Icon className='text-primary size-4' aria-hidden='true' />
        </Link>
      </Button>
      <Button
        variant='ghost'
        size='icon'
        aria-label='Delete user'
        onClick={() => setIsShowDeleteDialog(true)}
      >
        <Trash2Icon className='text-destructive size-4' aria-hidden='true' />
      </Button>
    </div>
  )
}
