import {
  Check,
  CheckCircle2,
  Globe,
  Layers,
  Palette,
  Rocket,
  Server,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type SetupStepperProps = {
  step: number
}

function getStepCardClass(isCurrent: boolean, isCompleted: boolean): string {
  if (isCurrent) return 'border-primary/50 bg-primary/5 shadow-xs'
  if (isCompleted) return 'border-emerald-500/30 bg-emerald-500/5'
  return 'border-border/60 bg-muted/20 opacity-60'
}

function getStepIconClass(isCurrent: boolean, isCompleted: boolean): string {
  if (isCurrent) return 'bg-primary text-primary-foreground shadow-sm'
  if (isCompleted) return 'bg-emerald-600 text-white'
  return 'bg-muted text-muted-foreground'
}

function getStepTitleClass(isCurrent: boolean, isCompleted: boolean): string {
  if (isCurrent) return 'text-primary'
  if (isCompleted) return 'text-emerald-700 dark:text-emerald-400'
  return 'text-foreground'
}

export function SetupStepper({ step }: SetupStepperProps) {
  const { t } = useTranslation()

  const stepsMeta = [
    {
      id: 1,
      title: t('setup.steps.brand'),
      desc: t('setup.steps.brandDesc'),
      icon: Globe,
    },
    {
      id: 2,
      title: t('setup.steps.theme'),
      desc: t('setup.steps.themeDesc'),
      icon: Palette,
    },
    {
      id: 3,
      title: t('setup.steps.admin'),
      desc: t('setup.steps.adminDesc'),
      icon: ShieldCheck,
    },
    {
      id: 4,
      title: t('setup.steps.review'),
      desc: t('setup.steps.reviewDesc'),
      icon: Rocket,
    },
  ]

  return (
    <div className='flex flex-col justify-between space-y-6 lg:col-span-5'>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <Badge variant='secondary' className='text-xs font-semibold'>
            {t('setup.stepProgress', { current: step, total: 4 })}
          </Badge>
          <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
            {t('setup.title')}
          </h1>
          <p className='text-muted-foreground text-sm sm:text-base'>
            {t('setup.subtitle')}
          </p>
        </div>

        {/* Vertical Stepper */}
        <div className='space-y-4'>
          {stepsMeta.map((s) => {
            const Icon = s.icon
            const isCurrent = step === s.id
            const isCompleted = step > s.id

            return (
              <div
                key={s.id}
                className={cn(
                  'flex items-start gap-4 rounded-xl border p-4 transition-all duration-200',
                  getStepCardClass(isCurrent, isCompleted)
                )}
              >
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg font-semibold transition-colors',
                    getStepIconClass(isCurrent, isCompleted)
                  )}
                >
                  {isCompleted ? (
                    <Check className='size-5' />
                  ) : (
                    <Icon className='size-5' />
                  )}
                </div>

                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between'>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        getStepTitleClass(isCurrent, isCompleted)
                      )}
                    >
                      {s.title}
                    </p>
                    {isCompleted && (
                      <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                        <CheckCircle2 className='inline size-3.5' />
                      </span>
                    )}
                  </div>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature Highlights Card */}
        <div className='bg-card text-card-foreground border-border/80 rounded-xl border p-4 shadow-2xs'>
          <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase'>
            {t('setup.features.title')}
          </p>
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <div className='bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md'>
                <ShieldCheck className='size-3.5' />
              </div>
              <div>
                <p className='text-xs font-medium'>
                  {t('setup.features.feat1.title')}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {t('setup.features.feat1.desc')}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <div className='bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md'>
                <Layers className='size-3.5' />
              </div>
              <div>
                <p className='text-xs font-medium'>
                  {t('setup.features.feat2.title')}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {t('setup.features.feat2.desc')}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <div className='bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md'>
                <Server className='size-3.5' />
              </div>
              <div>
                <p className='text-xs font-medium'>
                  {t('setup.features.feat3.title')}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {t('setup.features.feat3.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monorepo Stack Info */}
      <div className='text-muted-foreground hidden items-center gap-2 text-xs lg:flex'>
        <Badge variant='outline' className='text-[10px]'>
          Turborepo
        </Badge>
        <span>•</span>
        <span>NestJS 11</span>
        <span>•</span>
        <span>Next.js</span>
        <span>•</span>
        <span>Vite + React 19</span>
      </div>
    </div>
  )
}
