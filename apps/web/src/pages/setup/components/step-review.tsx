import {
  ArrowLeft,
  Check,
  Database,
  Globe,
  Lock,
  Palette,
  Rocket,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ThemeStyles } from '@/lib/theme-builder/default-theme'
import { themeColors } from '@/lib/theme-colors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { THEME_NAMES } from './step-theme'

type StepReviewProps = {
  siteBrandValue: string
  selectedThemeKey: string
  isCustomModified: boolean
  customStyles: ThemeStyles
  firstNameValue: string
  lastNameValue: string
  emailValue: string
  isPending: boolean
  onBack: () => void
}

function getThemeBadgeVariant(
  isCustomModified: boolean,
  selectedThemeKey: string
): 'default' | 'secondary' {
  if (isCustomModified) return 'default'
  if (selectedThemeKey === 'blue') return 'secondary'
  return 'default'
}

function getThemeBadgeLabel(
  isCustomModified: boolean,
  selectedThemeKey: string,
  customActiveLabel: string
): string {
  if (isCustomModified) return customActiveLabel
  if (selectedThemeKey === 'blue') return 'Default'
  return 'Preset'
}

export function StepReview({
  siteBrandValue,
  selectedThemeKey,
  isCustomModified,
  customStyles,
  firstNameValue,
  lastNameValue,
  emailValue,
  isPending,
  onBack,
}: StepReviewProps) {
  const { t } = useTranslation()

  return (
    <>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md'>
            <Rocket className='size-4' />
          </div>
          <div>
            <CardTitle className='text-lg font-bold'>
              {t('setup.review.title')}
            </CardTitle>
            <CardDescription>{t('setup.review.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4 pt-2'>
        {/* Configuration Summary Cards */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          {/* Platform Details */}
          <div className='bg-card space-y-1.5 rounded-xl border p-3.5'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-semibold'>
              <Globe className='size-3.5' />
              {t('setup.review.siteDetails')}
            </div>
            <p className='text-foreground truncate text-sm font-bold'>
              {siteBrandValue.trim() || 'Default Brand'}
            </p>
            <Badge variant='outline' className='text-[10px]'>
              {t('setup.review.siteName')}
            </Badge>
          </div>

          {/* Theme Details */}
          <div className='bg-card space-y-1.5 rounded-xl border p-3.5'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-semibold'>
              <Palette className='size-3.5' />
              {t('setup.review.themeColor')}
            </div>
            <div className='flex items-center gap-2'>
              <span
                className='size-3.5 shrink-0 rounded-full border shadow-xs'
                style={{
                  backgroundColor: isCustomModified
                    ? customStyles.light.primary || '#2563eb'
                    : themeColors[selectedThemeKey as keyof typeof themeColors]
                        ?.light['--primary'] || '#2563eb',
                }}
              />
              <p className='text-foreground truncate text-sm font-bold'>
                {isCustomModified
                  ? t('setup.review.customTheme')
                  : THEME_NAMES[selectedThemeKey] || selectedThemeKey}
              </p>
            </div>
            <Badge
              variant={getThemeBadgeVariant(isCustomModified, selectedThemeKey)}
              className='text-[10px]'
            >
              {getThemeBadgeLabel(
                isCustomModified,
                selectedThemeKey,
                t('setup.theme.customActiveBadge')
              )}
            </Badge>
          </div>

          {/* Superadmin Details */}
          <div className='bg-card space-y-1.5 rounded-xl border p-3.5 sm:col-span-2'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-semibold'>
              <ShieldCheck className='size-3.5' />
              {t('setup.review.adminDetails')}
            </div>
            <p className='text-foreground truncate text-sm font-bold'>
              {firstNameValue} {lastNameValue}
            </p>
            <p className='text-muted-foreground truncate text-xs'>
              {emailValue}
            </p>
          </div>
        </div>

        {/* Role and Permissions Info */}
        <div className='bg-primary/5 border-primary/20 flex items-center justify-between rounded-xl border p-3.5'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-bold'>
              <Lock className='size-4' />
            </div>
            <div>
              <p className='text-xs font-semibold'>{t('setup.review.role')}</p>
              <p className='text-muted-foreground text-xs'>
                {t('setup.review.roleValue')}
              </p>
            </div>
          </div>
          <Badge variant='default' className='text-xs'>
            Root Admin
          </Badge>
        </div>

        {/* Foundational Seeds Preview */}
        <div className='bg-muted/40 space-y-2.5 rounded-xl border p-4'>
          <div className='text-foreground flex items-center gap-2 text-xs font-semibold'>
            <Database className='text-primary size-4' />
            {t('setup.review.seedDetails')}
          </div>

          <ul className='text-muted-foreground space-y-1.5 text-xs'>
            <li className='flex items-center gap-2'>
              <Check className='size-3.5 text-emerald-600' />
              <span>{t('setup.review.seedThemes')}</span>
            </li>
            <li className='flex items-center gap-2'>
              <Check className='size-3.5 text-emerald-600' />
              <span>{t('setup.review.seedCms')}</span>
            </li>
            <li className='flex items-center gap-2'>
              <Check className='size-3.5 text-emerald-600' />
              <span>{t('setup.review.seedLocations')}</span>
            </li>
            <li className='flex items-center gap-2'>
              <Check className='size-3.5 text-emerald-600' />
              <span>{t('setup.review.seedRbac')}</span>
            </li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className='border-border/40 bg-muted/10 flex items-center justify-between border-t pt-4'>
        <Button
          type='button'
          variant='outline'
          size='lg'
          onClick={onBack}
          disabled={isPending}
          className='gap-2'
        >
          <ArrowLeft className='size-4' />
          {t('setup.button.back')}
        </Button>

        <Button
          type='submit'
          size='lg'
          disabled={isPending}
          className='min-w-44 gap-2 font-semibold'
        >
          {isPending ? (
            <>
              <span className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
              {t('setup.button.submitting')}
            </>
          ) : (
            <>
              <Rocket className='size-4' />
              {t('setup.button.submit')}
            </>
          )}
        </Button>
      </CardFooter>
    </>
  )
}
