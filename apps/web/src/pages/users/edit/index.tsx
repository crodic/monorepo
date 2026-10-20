import { useParams } from 'react-router'
import DataLoader from '@/components/layout/data-loader'
import { NotFoundError } from '@/pages/errors/not-found-error'
import { useDataGetUserEdit } from '../queries'
import { UserEditForm } from './user-edit-form'

export function PageUserEdit() {
  const params = useParams()

  const { data, isFetching } = useDataGetUserEdit(params.id as string)

  if (isFetching) return <DataLoader />

  if (!data) return <NotFoundError />

  return (
    <>
      <UserEditForm data={data} />
    </>
  )
}
