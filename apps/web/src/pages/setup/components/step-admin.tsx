import type { UseFormReturn } from 'react-hook-form'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
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
import { PasswordInput } from '@/components/password-input'
import type { SystemSetupSchema } from '../schema'

type StepAdminProps = {
  form: UseFormReturn<SystemSetupSchema>
  passwordCriteria: Array<{ key: string; valid: boolean; label: string }>
  onBack: () => void
  onNext: () => void
}

export function StepAdmin({
  form,
  passwordCriteria,
  onBack,
  onNext,
}: StepAdminProps) {
  const { t } = useTranslation()

  return (
    <>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md'>
            <ShieldCheck className='size-4' />
          </div>
          <div>
            <CardTitle className='text-lg font-bold'>
              {t('setup.adminAccount')}
            </CardTitle>
            <CardDescription>{t('setup.adminAccountHelp')}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4 pt-2'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='firstName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('setup.firstName')}</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      placeholder='John'
                      className='pl-9'
                      autoFocus
                      {...field}
                    />
                    <User className='text-muted-foreground absolute top-2.5 left-3 size-4' />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='lastName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('setup.lastName')}</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input placeholder='Doe' className='pl-9' {...field} />
                    <User className='text-muted-foreground absolute top-2.5 left-3 size-4' />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('setup.email')}</FormLabel>
              <FormControl>
                <div className='relative'>
                  <Input
                    placeholder='admin@example.com'
                    type='email'
                    className='pl-9'
                    {...field}
                  />
                  <Mail className='text-muted-foreground absolute top-2.5 left-3 size-4' />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('setup.password')}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder='••••••••' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('setup.confirmPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder='••••••••' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Real-time Password Requirements Checklist */}
        <div className='bg-muted/40 rounded-xl border p-4'>
          <p className='text-muted-foreground mb-2 text-xs font-semibold'>
            {t('setup.pwdReq.title')}
          </p>
          <div className='grid grid-cols-1 gap-1.5 sm:grid-cols-2'>
            {passwordCriteria.map((item) => (
              <div key={item.key} className='flex items-center gap-2 text-xs'>
                {item.valid ? (
                  <CheckCircle2 className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                ) : (
                  <Circle className='text-muted-foreground/60 size-3.5' />
                )}
                <span
                  className={cn(
                    item.valid
                      ? 'font-medium text-emerald-700 dark:text-emerald-300'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className='border-border/40 bg-muted/10 flex items-center justify-between border-t pt-4'>
        <Button
          type='button'
          variant='outline'
          size='lg'
          onClick={onBack}
          className='gap-2'
        >
          <ArrowLeft className='size-4' />
          {t('setup.button.back')}
        </Button>
        <Button type='button' size='lg' onClick={onNext} className='gap-2'>
          {t('setup.button.continue')}
          <ArrowRight className='size-4' />
        </Button>
      </CardFooter>
    </>
  )
}
