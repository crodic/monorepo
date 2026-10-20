import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Main } from '@/components/layout/main'
import { CmsPageForm } from '../cms-page-form'
import { apiCreateCmsPage } from '../queries'
import type { CmsPageFormSchema } from '../schema'

export function PageCmsPageCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: apiCreateCmsPage,
    onSuccess: (page) => {
      toast.success(
        t('cmsPages.message.createSuccess', 'Page created successfully')
      )
      navigate(`/cms-pages/${page.id}/show`)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        t('cmsPages.message.createError', 'Could not create page')
      toast.error(Array.isArray(message) ? message.join(', ') : message)
    },
  })

  const handleSubmit = (data: CmsPageFormSchema) => {
    mutation.mutate(data)
  }

  return (
    <>
      <Main fixed fluid className='h-[calc(100svh-4rem)] min-h-0 p-0'>
        <CmsPageForm
          isSubmitting={mutation.isPending}
          onSubmit={handleSubmit}
        />
      </Main>
    </>
  )
}
