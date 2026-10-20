import { useParams } from 'react-router'
import DataLoader from '@/components/layout/data-loader'
import { NotFoundError } from '@/pages/errors/not-found-error'
import { useDataRoleEdit } from '../queries'
import { RoleEditForm } from './role-edit-form'

export function PageRoleEdit() {
  const params = useParams()

  const { data, isFetching } = useDataRoleEdit(params.id as string)

  if (isFetching) return <DataLoader />

  if (!data) return <NotFoundError />

  return (
    <>
      <RoleEditForm data={data} />
    </>
  )
}
