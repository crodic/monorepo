import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import DataLoader from '@/components/layout/data-loader'
import { Main } from '@/components/layout/main'
import { NotFoundError } from '@/pages/errors/not-found-error'
import { CmsPageForm } from '../cms-page-form'
import { apiUpdateCmsPage, useDataCmsPageById } from '../queries'
import type { CmsPageFormSchema } from '../schema'

export function PageCmsPageEdit() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, isFetching } = useDataCmsPageById(id ?? '')
  const mutation = useMutation({
    mutationFn: apiUpdateCmsPage,
    onSuccess: (page) => {
      toast.success(
        t('cmsPages.message.updateSuccess', 'Page updated successfully')
      )
      navigate(`/cms-pages/${page.id}/show`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        t('cmsPages.message.updateError', 'Could not update page')
      toast.error(Array.isArray(message) ? message.join(', ') : message)
    },
  })

  if (isFetching) return <DataLoader />
  if (!id || !data) return <NotFoundError />

  const handleSubmit = (formData: CmsPageFormSchema) => {
    mutation.mutate({ id, data: formData })
  }

  return (
    <>
      <Main fixed fluid className='h-[calc(100svh-4rem)] min-h-0 p-0'>
        <CmsPageForm
          initialData={data}
          isSubmitting={mutation.isPending}
          onSubmit={handleSubmit}
        />
      </Main>
    </>
  )
}
