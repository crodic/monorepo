import { useParams } from 'react-router'
import DataLoader from '@/components/layout/data-loader'
import { NotFoundError } from '@/pages/errors/not-found-error'
import { useDataGetAdminEdit } from '../queries'
import { AdminEditForm } from './admin-edit-form'

export function PageAdminEdit() {
  const params = useParams()

  const { data, isFetching } = useDataGetAdminEdit(params.id as string)

  if (isFetching) return <DataLoader />

  if (!data) return <NotFoundError />

  return (
    <>
      <AdminEditForm data={data} />
    </>
  )
}
