import {
  ArrowLeft,
  ArrowRight,
  Check,
  Palette,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ThemeMode, ThemeStyles } from '@/lib/theme-builder/default-theme'
import { themeColors } from '@/lib/theme-colors'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeTokenEditor } from '@/pages/white-labels/components/theme-token-editor'

export const THEME_NAMES: Record<string, string> = {
  blue: 'Default Blue',
  neutral: 'Neutral Minimalist',
  red: 'Crimson Red',
  violet: 'Violet Luxury',
  yellow: 'Amber Glow',
  green: 'Emerald Nature',
  orange: 'Sunset Orange',
  pink: 'Rose Quartz',
  slate: 'Slate Corporate',
  teal: 'Ocean Teal',
  cyan: 'Cyan Breeze',
  indigo: 'Deep Indigo',
  purple: 'Royal Purple',
  neonNoir: 'Neon Noir',
}

type StepThemeProps = {
  selectedThemeKey: string
  isCustomModified: boolean
  customStyles: ThemeStyles
  editorMode: ThemeMode
  activeThemeTab: 'presets' | 'custom'
  setActiveThemeTab: (tab: 'presets' | 'custom') => void
  setEditorMode: (mode: ThemeMode) => void
  onSelectTheme: (key: keyof typeof themeColors) => void
  onCustomStylesChange: (styles: ThemeStyles) => void
  onBack: () => void
  onSkipToDefault: () => void
  onNext: () => void
}

export function StepTheme({
  selectedThemeKey,
  isCustomModified,
  customStyles,
  editorMode,
  activeThemeTab,
  setActiveThemeTab,
  setEditorMode,
  onSelectTheme,
  onCustomStylesChange,
  onBack,
  onSkipToDefault,
  onNext,
}: StepThemeProps) {
  const { t } = useTranslation()

  return (
    <>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md'>
              <Palette className='size-4' />
            </div>
            <div>
              <CardTitle className='text-lg font-bold'>
                {t('setup.theme.builderTitle')}
              </CardTitle>
              <CardDescription>{t('setup.theme.builderDesc')}</CardDescription>
            </div>
          </div>

          {isCustomModified && (
            <Badge variant='default' className='text-xs'>
              {t('setup.theme.customActiveBadge')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-5 pt-2'>
        {/* Tabs: Presets vs Custom Token Editor */}
        <Tabs
          value={activeThemeTab}
          onValueChange={(val) =>
            setActiveThemeTab(val as 'presets' | 'custom')
          }
          className='w-full space-y-4'
        >
          <div className='flex items-center justify-between'>
            <TabsList className='grid w-full grid-cols-2 sm:w-80'>
              <TabsTrigger value='presets' className='gap-2 text-xs'>
                <Palette className='size-3.5' />
                {t('setup.theme.tabPresets')}
              </TabsTrigger>
              <TabsTrigger value='custom' className='gap-2 text-xs'>
                <Sliders className='size-3.5' />
                {t('setup.theme.tabCustom')}
              </TabsTrigger>
            </TabsList>

            {selectedThemeKey !== 'blue' && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => onSelectTheme('blue')}
                className='hidden h-8 gap-1.5 text-xs sm:inline-flex'
              >
                <RotateCcw className='size-3.5' />
                {t('setup.theme.resetDefault')}
              </Button>
            )}
          </div>

          {/* TAB 1: PRESET PALETTES */}
          <TabsContent value='presets' className='mt-0 space-y-5'>
            {/* Active Theme Bar */}
            <div className='bg-muted/40 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-3'>
                <div
                  className='border-background size-7 shrink-0 rounded-full border-2 shadow-xs'
                  style={{
                    backgroundColor:
                      themeColors[selectedThemeKey as keyof typeof themeColors]
                        ?.light['--primary'] || '#2563eb',
                  }}
                />
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground text-xs'>
                      {t('setup.theme.selected')}
                    </span>
                    <span className='text-sm font-bold'>
                      {THEME_NAMES[selectedThemeKey] || selectedThemeKey}
                    </span>
                    <Badge
                      variant={
                        selectedThemeKey === 'blue' ? 'secondary' : 'default'
                      }
                      className='text-[10px]'
                    >
                      {selectedThemeKey === 'blue' ? 'Default' : 'Preset'}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    {t('setup.theme.presetsDesc')}
                  </p>
                </div>
              </div>

              {selectedThemeKey !== 'blue' && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => onSelectTheme('blue')}
                  className='h-8 gap-1.5 self-start text-xs sm:hidden'
                >
                  <RotateCcw className='size-3.5' />
                  {t('setup.theme.resetDefault')}
                </Button>
              )}
            </div>

            {/* Presets Grid */}
            <div className='space-y-2.5'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                  {t('setup.theme.presetsTitle')}
                </span>
                <span className='text-muted-foreground text-[11px]'>
                  14 Presets
                </span>
              </div>

              <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4'>
                {Object.entries(themeColors).map(([key, val]) => {
                  const isSelected =
                    selectedThemeKey === key && !isCustomModified
                  const colorDef = val.light
                  const primaryColor = colorDef['--primary']
                  const chart1 = colorDef['--chart-1'] || primaryColor
                  const chart2 = colorDef['--chart-2'] || primaryColor

                  return (
                    <button
                      key={key}
                      type='button'
                      onClick={() =>
                        onSelectTheme(key as keyof typeof themeColors)
                      }
                      className={cn(
                        'group relative flex cursor-pointer flex-col items-start rounded-xl border p-3 text-left transition-all duration-200',
                        isSelected
                          ? 'border-primary ring-primary/20 bg-primary/5 shadow-xs ring-2'
                          : 'border-border/70 hover:border-border hover:bg-muted/40'
                      )}
                    >
                      <div className='mb-2 flex w-full items-center justify-between'>
                        <div className='flex items-center -space-x-1.5'>
                          <span
                            className='border-background size-5 shrink-0 rounded-full border shadow-xs'
                            style={{
                              backgroundColor: primaryColor,
                            }}
                          />
                          <span
                            className='border-background size-4 shrink-0 rounded-full border opacity-80 shadow-xs'
                            style={{
                              backgroundColor: chart1,
                            }}
                          />
                          <span
                            className='border-background size-3.5 shrink-0 rounded-full border opacity-60 shadow-xs'
                            style={{
                              backgroundColor: chart2,
                            }}
                          />
                        </div>
                        {isSelected && (
                          <span className='bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full'>
                            <Check className='size-2.5' />
                          </span>
                        )}
                      </div>

                      <span
                        className={cn(
                          'line-clamp-1 text-xs leading-tight font-semibold',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {THEME_NAMES[key] || key}
                      </span>
                      <span className='text-muted-foreground mt-0.5 text-[10px] capitalize'>
                        {key}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Live Component Preview */}
            <div className='bg-muted/20 space-y-3 rounded-xl border p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Sparkles className='text-primary size-3.5' />
                  <span className='text-foreground text-xs font-semibold'>
                    {t('setup.theme.previewTitle')}
                  </span>
                </div>
                <Badge variant='outline' className='text-[10px]'>
                  {t('setup.theme.sampleBadge')}
                </Badge>
              </div>

              <p className='text-muted-foreground text-xs'>
                {t('setup.theme.previewDesc')}
              </p>

              <div className='flex flex-wrap items-center gap-2 pt-1'>
                <Button type='button' size='sm'>
                  {t('setup.theme.sampleAction')}
                </Button>
                <Button type='button' size='sm' variant='secondary'>
                  {t('setup.theme.sampleSecondary')}
                </Button>
                <Button type='button' size='sm' variant='outline'>
                  {t('setup.theme.sampleOutline')}
                </Button>
                <Button type='button' size='sm' variant='destructive'>
                  {t('setup.theme.sampleDestructive')}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ADVANCED TOKEN EDITOR */}
          <TabsContent value='custom' className='mt-0 space-y-4'>
            <div className='bg-muted/30 text-muted-foreground flex items-center justify-between rounded-xl border p-3 text-xs'>
              <span>{t('setup.theme.customNotice')}</span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-7 gap-1 text-xs'
                onClick={() => onSelectTheme('blue')}
              >
                <RotateCcw className='size-3' />
                {t('setup.theme.resetDefault')}
              </Button>
            </div>

            <div className='border-border/80 max-h-[560px] overflow-y-auto rounded-xl border shadow-2xs'>
              <ThemeTokenEditor
                value={customStyles}
                mode={editorMode}
                onModeChange={setEditorMode}
                onChange={onCustomStylesChange}
              />
            </div>
          </TabsContent>
        </Tabs>
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

        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='lg'
            onClick={onSkipToDefault}
            className='text-muted-foreground hover:text-foreground'
          >
            {t('setup.theme.skipDefault')}
          </Button>
          <Button type='button' size='lg' onClick={onNext} className='gap-2'>
            {t('setup.button.continue')}
            <ArrowRight className='size-4' />
          </Button>
        </div>
      </CardFooter>
    </>
  )
}
