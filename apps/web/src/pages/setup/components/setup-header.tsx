import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import LanguageSelect from '@/components/common/language-select'
import { RuntimeLogo } from '@/components/runtime-logo'
import { ThemeSwitch } from '@/components/theme-switch'

export function SetupHeader() {
  const { t } = useTranslation()

  return (
    <header className='border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
        <div className='flex items-center gap-3'>
          <RuntimeLogo
            className='max-h-8 w-auto'
            placeholderClassName='h-8 w-24'
          />
          <span className='bg-border hidden h-4 w-px sm:inline-block' />
          <Badge
            variant='outline'
            className='bg-primary/5 text-primary border-primary/20 hidden text-xs font-medium sm:inline-flex'
          >
            <Sparkles className='mr-1 size-3' />
            {t('setup.badge')}
          </Badge>
        </div>

        <div className='flex items-center gap-3'>
          <LanguageSelect />
          <ThemeSwitch />
        </div>
      </div>
    </header>
  )
}
