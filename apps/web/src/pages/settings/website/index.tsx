import { useTranslation } from 'react-i18next'
import { Separator } from '@/components/ui/separator'
import { Main } from '@/components/layout/main'
import WebsiteForm from './website-form'

export function SettingsWebsite() {
  const { t } = useTranslation()

  return (
    <>
      <Main>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-xl'>
            {t('settings.website.title')}
          </h1>
          <p className='text-muted-foreground'>
            {t('settings.website.description')}
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <WebsiteForm />
      </Main>
    </>
  )
}
