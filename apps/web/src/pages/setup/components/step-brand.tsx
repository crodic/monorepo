import { useWatch, type UseFormReturn } from 'react-hook-form'
import { ArrowRight, Globe, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { SystemSetupSchema } from '../schema'

type StepBrandProps = {
  form: UseFormReturn<SystemSetupSchema>
  siteBrandValue?: string
  onNext: () => void
}

export function StepBrand({ form, siteBrandValue, onNext }: StepBrandProps) {
  const { t } = useTranslation()
  const watchedBrand = useWatch({
    control: form.control,
    name: 'site_brand',
    defaultValue: '',
  })
  const brandDisplay = (siteBrandValue ?? watchedBrand ?? '').trim()

  return (
    <>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md'>
            <Globe className='size-4' />
          </div>
          <div>
            <CardTitle className='text-lg font-bold'>
              {t('setup.websiteDetails')}
            </CardTitle>
            <CardDescription>{t('setup.websiteNameHelp')}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6 pt-2'>
        <FormField
          control={form.control}
          name='site_brand'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='font-semibold'>
                {t('setup.websiteName')}
              </FormLabel>
              <FormControl>
                <div className='relative'>
                  <Input
                    placeholder={t('setup.websiteNamePlaceholder')}
                    className='h-11 pl-10 text-base'
                    autoFocus
                    {...field}
                  />
                  <Globe className='text-muted-foreground absolute top-3 left-3 size-5' />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Live Brand Preview Box */}
        <div className='bg-muted/40 rounded-xl border border-dashed p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-muted-foreground text-xs font-medium'>
              {t('setup.brandPreview')}
            </span>
            <Badge variant='outline' className='text-[10px]'>
              Mockup Tab
            </Badge>
          </div>

          {/* Simulated browser tab preview */}
          <div className='bg-background border-border/80 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-2xs'>
            <div className='bg-primary/20 flex size-4 items-center justify-center rounded-xs'>
              <Sparkles className='text-primary size-2.5' />
            </div>
            <span className='truncate font-medium'>
              {brandDisplay || 'My Platform'} — Admin Portal
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className='border-border/40 bg-muted/10 flex justify-end border-t pt-4'>
        <Button type='button' size='lg' onClick={onNext} className='gap-2'>
          {t('setup.button.continue')}
          <ArrowRight className='size-4' />
        </Button>
      </CardFooter>
    </>
  )
}
