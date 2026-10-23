import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  cloneDefaultThemeStyles,
  type ThemeMode,
  type ThemeStyles,
} from '@/lib/theme-builder/default-theme'
import { applyThemeStylesToElement } from '@/lib/theme-builder/theme-utils'
import { themeColors } from '@/lib/theme-colors'
import { useTheme } from '@/context/theme-provider'
import { Card } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { SetupHeader } from './components/setup-header'
import { SetupStepper } from './components/setup-stepper'
import { StepAdmin } from './components/step-admin'
import { StepBrand } from './components/step-brand'
import { StepReview } from './components/step-review'
import { StepTheme } from './components/step-theme'
import { useSystemSetupMutation } from './queries'
import { systemSetupSchema, type SystemSetupSchema } from './schema'

type Step = 1 | 2 | 3 | 4

function getPresetThemeStyles(colorKey: keyof typeof themeColors): ThemeStyles {
  const base = cloneDefaultThemeStyles()
  const preset = themeColors[colorKey]
  if (!preset) return base

  Object.entries(preset.light).forEach(([key, val]) => {
    const cleanKey = key.replace(/^--/, '')
    base.light[cleanKey] = val
  })
  Object.entries(preset.dark).forEach(([key, val]) => {
    const cleanKey = key.replace(/^--/, '')
    base.dark[cleanKey] = val
  })
  return base
}

export function PageSystemSetup() {
  const { t } = useTranslation()
  const { setColorKey, colorKey, resolvedTheme } = useTheme()
  const [step, setStep] = useState<Step>(1)
  const { mutateAsync: setupSystem, isPending } = useSystemSetupMutation()

  const [editorMode, setEditorMode] = useState<ThemeMode>(() =>
    resolvedTheme === 'dark' ? 'dark' : 'light'
  )
  const [customStyles, setCustomStyles] = useState<ThemeStyles>(() =>
    cloneDefaultThemeStyles()
  )
  const [isCustomModified, setIsCustomModified] = useState(false)
  const [activeThemeTab, setActiveThemeTab] = useState<'presets' | 'custom'>(
    'presets'
  )

  const form = useForm<SystemSetupSchema>({
    resolver: zodResolver(systemSetupSchema),
    mode: 'onChange',
    defaultValues: {
      site_brand: '',
      theme_key: 'blue',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = form.watch('password') || ''
  const confirmPasswordValue = form.watch('confirmPassword') || ''
  const siteBrandValue = form.watch('site_brand') || ''
  const firstNameValue = form.watch('firstName') || ''
  const lastNameValue = form.watch('lastName') || ''
  const emailValue = form.watch('email') || ''
  const selectedThemeKey = form.watch('theme_key') || colorKey || 'blue'

  // Real-time password requirement checklist
  const passwordCriteria = [
    {
      key: 'min',
      valid: passwordValue.length >= 8,
      label: t('setup.pwdReq.min'),
    },
    {
      key: 'upper',
      valid: /[A-Z]/.test(passwordValue),
      label: t('setup.pwdReq.upper'),
    },
    {
      key: 'lower',
      valid: /[a-z]/.test(passwordValue),
      label: t('setup.pwdReq.lower'),
    },
    {
      key: 'number',
      valid: /[0-9]/.test(passwordValue),
      label: t('setup.pwdReq.number'),
    },
    {
      key: 'special',
      valid: /[^a-zA-Z0-9]/.test(passwordValue),
      label: t('setup.pwdReq.special'),
    },
    {
      key: 'match',
      valid:
        confirmPasswordValue.length > 0 &&
        confirmPasswordValue === passwordValue,
      label: t('setup.pwdReq.match'),
    },
  ]

  const handleNextFromStep1 = async () => {
    const isStep1Valid = await form.trigger(['site_brand'])
    if (isStep1Valid) {
      setStep(2)
    }
  }

  const handleSelectTheme = (key: keyof typeof themeColors) => {
    form.setValue('theme_key', key)
    form.setValue('custom_styles', undefined)
    setColorKey(key)
    setCustomStyles(getPresetThemeStyles(key))
    setIsCustomModified(false)
  }

  const handleCustomStylesChange = (newStyles: ThemeStyles) => {
    setCustomStyles(newStyles)
    setIsCustomModified(true)
    form.setValue('custom_styles', newStyles)
    applyThemeStylesToElement(document.documentElement, newStyles, editorMode)
  }

  const handleSkipToDefault = () => {
    form.setValue('theme_key', 'blue')
    form.setValue('custom_styles', undefined)
    setColorKey('blue')
    setCustomStyles(getPresetThemeStyles('blue'))
    setIsCustomModified(false)
    setStep(3)
  }

  const handleNextFromStep2 = () => {
    setStep(3)
  }

  const handleNextFromStep3 = async () => {
    const isStep3Valid = await form.trigger([
      'firstName',
      'lastName',
      'email',
      'password',
      'confirmPassword',
    ])
    if (isStep3Valid) {
      setStep(4)
    }
  }

  const onSubmit = async (data: SystemSetupSchema) => {
    try {
      await setupSystem(data)
      toast.success(t('setup.completeSuccess'))
      window.location.assign('/sign-in')
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t('setup.failed', { defaultValue: 'Failed to setup system' })
      )
    }
  }

  return (
    <div className='bg-background flex min-h-dvh flex-col'>
      {/* Top Header Bar */}
      <SetupHeader />

      {/* Main Container */}
      <main className='container mx-auto flex-1 px-4 py-8 sm:px-6 sm:py-12'>
        <div className='mx-auto max-w-6xl'>
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-12'>
            {/* Left Column: Visual Stepper & Feature Highlights */}
            <SetupStepper step={step} />

            {/* Right Column: Interactive Form Card */}
            <div className='lg:col-span-7'>
              <Card className='border-border/80 relative overflow-hidden shadow-sm'>
                {/* Progress bar line */}
                <div className='bg-muted h-1.5 w-full'>
                  <div
                    className='bg-primary h-full transition-[width] duration-200 ease-out'
                    style={{
                      width: `${step * 25}%`,
                    }}
                  />
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    {step === 1 && (
                      <StepBrand
                        form={form}
                        siteBrandValue={siteBrandValue}
                        onNext={handleNextFromStep1}
                      />
                    )}

                    {step === 2 && (
                      <StepTheme
                        selectedThemeKey={selectedThemeKey}
                        isCustomModified={isCustomModified}
                        customStyles={customStyles}
                        editorMode={editorMode}
                        activeThemeTab={activeThemeTab}
                        setActiveThemeTab={setActiveThemeTab}
                        setEditorMode={setEditorMode}
                        onSelectTheme={handleSelectTheme}
                        onCustomStylesChange={handleCustomStylesChange}
                        onBack={() => setStep(1)}
                        onSkipToDefault={handleSkipToDefault}
                        onNext={handleNextFromStep2}
                      />
                    )}

                    {step === 3 && (
                      <StepAdmin
                        form={form}
                        passwordCriteria={passwordCriteria}
                        onBack={() => setStep(2)}
                        onNext={handleNextFromStep3}
                      />
                    )}

                    {step === 4 && (
                      <StepReview
                        siteBrandValue={siteBrandValue}
                        selectedThemeKey={selectedThemeKey}
                        isCustomModified={isCustomModified}
                        customStyles={customStyles}
                        firstNameValue={firstNameValue}
                        lastNameValue={lastNameValue}
                        emailValue={emailValue}
                        isPending={isPending}
                        onBack={() => setStep(3)}
                      />
                    )}
                  </form>
                </Form>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
