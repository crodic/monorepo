import { Edit2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import type { PermissionSchema } from './schema'

export default function ComponentTableRowActions({
  row,
}: {
  row: { original: PermissionSchema }
}) {
  const navigate = useNavigate()

  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Edit permission'
      onClick={() => navigate(`/permissions/${row.original.id}/edit`)}
    >
      <Edit2Icon size={16} aria-hidden='true' className='text-primary' />
    </Button>
  )
}
