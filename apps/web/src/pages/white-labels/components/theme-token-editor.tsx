import { useMemo, useRef, useState } from 'react'
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  MoonIcon,
  RotateCcwIcon,
  SunIcon,
} from 'lucide-react'
import {
  COMMON_THEME_STYLE_KEYS,
  defaultThemeStyles,
  type ThemeMode,
  type ThemeStyleKey,
  type ThemeStyles,
} from '@/lib/theme-builder/default-theme'
import { setThemeStyleValue } from '@/lib/theme-builder/theme-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  adjustColorByHsl,
  applyHslAdjustmentToStyles,
  buildFontFamily,
  colorTokenGroups,
  colorTokenKeys,
  defaultHslAdjustment,
  extractFontFamily,
  fontCategoryLabels,
  formatCssUnit,
  formatEmValue,
  formatTokenLabel,
  getColorPickerValue,
  getContrastRatio,
  getShadowPreview,
  hslPresets,
  isDefaultHslAdjustment,
  loadGoogleFont,
  parseCssNumber,
  parseEmValue,
  popularFonts,
  tailwindColors,
  type FontCategory,
  type HslAdjustment,
} from './theme-token-palettes'

export * from './theme-token-palettes'

function WcagContrastBadge({ bg, fg }: { bg?: string; fg?: string }) {
  const ratio = getContrastRatio(bg, fg)
  if (ratio === null) return null

  const formatted = ratio.toFixed(1)
  const isPass = ratio >= 4.5

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold normal-case tabular-nums transition-colors',
        isPass
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
      )}
      title={
        isPass
          ? `Contrast ratio ${formatted}:1 passes WCAG AA for normal text`
          : `Contrast ratio ${formatted}:1 is below the WCAG AA minimum 4.5:1`
      }
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          isPass ? 'bg-emerald-500' : 'bg-amber-500'
        )}
      />
      {isPass ? `AA (${formatted}:1)` : `Low (${formatted}:1)`}
    </span>
  )
}

function SliderWithInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  const inputId = `theme-slider-${label.replace(/\s+/g, '-').toLowerCase()}`

  const updateValue = (nextValue: number) => {
    const normalized = Math.max(min, Math.min(max, nextValue))
    onChange(normalized)
  }

  return (
    <div className='flex items-center gap-2 py-0.5'>
      <Label
        htmlFor={inputId}
        className='text-muted-foreground w-20 shrink-0 text-xs font-medium'
      >
        {label}
      </Label>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        className='min-w-0 flex-1'
        onValueChange={([nextValue]) => updateValue(nextValue ?? min)}
      />
      <div className='flex shrink-0 items-center gap-1'>
        <Input
          id={inputId}
          type='number'
          value={Number(value.toFixed(3))}
          min={min}
          max={max}
          step={step}
          className='h-8 w-16 px-2 text-xs'
          onChange={(event) => {
            const numeric = Number.parseFloat(
              event.target.value.replace(',', '.')
            )
            if (Number.isFinite(numeric)) updateValue(numeric)
          }}
        />
        <span className='text-muted-foreground w-7 text-xs'>{unit}</span>
      </div>
    </div>
  )
}

function HslPresetButton({
  preset,
  currentStyles,
  selected,
  onClick,
}: {
  preset: HslAdjustment & { label: string }
  currentStyles: Record<string, string>
  selected: boolean
  onClick: () => void
}) {
  const previewBg = adjustColorByHsl(
    currentStyles.background,
    preset.hueShift,
    preset.saturationScale,
    preset.lightnessScale
  )
  const previewPrimary = adjustColorByHsl(
    currentStyles.primary,
    preset.hueShift,
    preset.saturationScale,
    preset.lightnessScale
  )
  const previewSecondary = adjustColorByHsl(
    currentStyles.secondary,
    preset.hueShift,
    preset.saturationScale,
    preset.lightnessScale
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className={cn(
            'relative h-9 overflow-hidden rounded-md p-0 shadow-sm transition-all hover:scale-[1.03] hover:shadow-md',
            selected && 'ring-primary ring-1 ring-offset-1'
          )}
          style={{ background: previewBg }}
          onClick={onClick}
        >
          <span className='absolute inset-0 flex'>
            <span
              className='h-full w-1/2 rounded-l-md'
              style={{ background: previewPrimary }}
            />
            <span
              className='h-full w-1/2 rounded-r-md'
              style={{ background: previewSecondary }}
            />
          </span>
          {selected && (
            <span className='bg-primary absolute right-1 bottom-1 size-2 rounded-full' />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom'>{preset.label}</TooltipContent>
    </Tooltip>
  )
}

function ColorClassPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const currentColor = tailwindColors.find(([, hex]) => hex === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='hidden w-35 shrink-0 justify-between px-2 font-mono text-xs xl:flex'
        >
          {currentColor ? `bg-${currentColor[0]}` : 'Tailwind'}
          <ChevronDownIcon className='size-3.5 opacity-60' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='z-100 w-72 p-0' align='end'>
        <Command>
          <CommandInput placeholder='Search class...' />
          <CommandList>
            <CommandEmpty>No color class found.</CommandEmpty>
            <CommandGroup heading='Tailwind colors'>
              {tailwindColors.map(([name, hex]) => (
                <CommandItem
                  key={name}
                  value={`bg-${name} ${hex}`}
                  onSelect={() => onChange(hex)}
                >
                  <span
                    className='size-3 rounded-sm border'
                    style={{ backgroundColor: hex }}
                  />
                  <span className='font-mono text-xs'>bg-{name}</span>
                  <span className='text-muted-foreground ml-auto font-mono text-xs'>
                    {hex}
                  </span>
                  {hex === value && <CheckIcon className='size-4' />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function FontPicker({
  value,
  category,
  placeholder,
  onChange,
}: {
  value: string
  category: FontCategory
  placeholder: string
  onChange: (value: string) => void
}) {
  const [selectedCategory, setSelectedCategory] =
    useState<FontCategory>(category)
  const selectedFontName = extractFontFamily(value)
  const fonts = useMemo(
    () => popularFonts.filter((font) => font.category === selectedCategory),
    [selectedCategory]
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='bg-input/25 w-full justify-between'
        >
          <span
            className='truncate'
            style={{ fontFamily: selectedFontName ? value : undefined }}
          >
            {selectedFontName || placeholder}
          </span>
          <ChevronDownIcon className='size-4 opacity-60' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='z-100 w-[min(24rem,calc(100vw-2rem))] overflow-hidden p-0'
        align='start'
        sideOffset={8}
        collisionPadding={16}
      >
        <Command>
          <CommandInput placeholder='Search Google fonts...' />
          <div className='border-b p-2'>
            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value as FontCategory)
              }
              className='border-input bg-background h-9 rounded-md border px-2 text-sm outline-none'
            >
              {Object.entries(fontCategoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <CommandList className='max-h-80'>
            <CommandEmpty>No fonts found.</CommandEmpty>
            <CommandGroup heading='Popular'>
              {fonts.map((font) => {
                const fontFamily = buildFontFamily(font.family, font.category)
                const isSelected = font.family === selectedFontName

                return (
                  <CommandItem
                    key={font.family}
                    value={`${font.family} ${font.category}`}
                    onMouseEnter={() => loadGoogleFont(font.family)}
                    onSelect={() => {
                      loadGoogleFont(font.family)
                      onChange(fontFamily)
                    }}
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-base' style={{ fontFamily }}>
                        {font.family}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {font.category}
                        {font.variable ? ' • Variable' : ''}
                      </p>
                    </div>
                    {isSelected && <CheckIcon className='size-4' />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function FontFamilyRow({
  label,
  value,
  category,
  placeholder,
  onChange,
  onReset,
}: {
  label: string
  value: string
  category: FontCategory
  placeholder: string
  onChange: (value: string) => void
  onReset: () => void
}) {
  return (
    <div className='grid grid-cols-[5rem_minmax(0,1fr)_2.25rem] items-center gap-3'>
      <Label className='text-muted-foreground text-xs'>{label}</Label>
      <div className='min-w-0'>
        <FontPicker
          value={value}
          category={category}
          placeholder={placeholder}
          onChange={onChange}
        />
      </div>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-9 shrink-0'
        onClick={onReset}
      >
        <RotateCcwIcon className='size-4' />
        <span className='sr-only'>Reset {label}</span>
      </Button>
    </div>
  )
}

function LetterSpacingControl({
  value,
  onChange,
  onReset,
}: {
  value: string
  onChange: (value: string) => void
  onReset: () => void
}) {
  const numericValue = parseEmValue(value)

  const updateValue = (nextValue: number) => {
    onChange(formatEmValue(nextValue))
  }

  return (
    <div className='grid gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <Label className='font-mono text-xs'>Tracking</Label>
        <span className='text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-[10px]'>
          em
        </span>
      </div>
      <div className='flex items-center gap-3'>
        <Slider
          min={-0.1}
          max={0.2}
          step={0.005}
          value={[numericValue]}
          className='min-w-0 flex-1'
          onValueChange={([nextValue]) => updateValue(nextValue ?? 0)}
        />
        <div className='relative w-28 shrink-0'>
          <Input
            type='number'
            min={-0.1}
            max={0.2}
            step={0.005}
            value={Number(numericValue.toFixed(3))}
            className='pr-8 font-mono text-xs'
            onChange={(event) => updateValue(Number(event.target.value))}
          />
          <span className='text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs'>
            em
          </span>
        </div>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-9 shrink-0'
          onClick={onReset}
        >
          <RotateCcwIcon className='size-4' />
          <span className='sr-only'>Reset tracking</span>
        </Button>
      </div>
    </div>
  )
}

function HslAdjustmentControl({
  currentStyles,
  adjustment,
  onChange,
}: {
  currentStyles: Record<string, string>
  adjustment: HslAdjustment
  onChange: (adjustment: HslAdjustment) => void
}) {
  const [showAllPresets, setShowAllPresets] = useState(false)
  const visiblePresets = showAllPresets ? hslPresets : hslPresets.slice(0, 10)

  const handleChange = (key: keyof HslAdjustment, nextValue: number) => {
    onChange({ ...adjustment, [key]: nextValue })
  }

  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-5 gap-2 sm:grid-cols-7 xl:grid-cols-5 2xl:grid-cols-7'>
        {visiblePresets.map((preset) => (
          <HslPresetButton
            key={preset.label}
            preset={preset}
            currentStyles={currentStyles}
            selected={
              adjustment.hueShift === preset.hueShift &&
              adjustment.saturationScale === preset.saturationScale &&
              adjustment.lightnessScale === preset.lightnessScale
            }
            onClick={() => onChange(preset)}
          />
        ))}
      </div>
      {hslPresets.length > 10 && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='text-muted-foreground w-full text-xs'
          onClick={() => setShowAllPresets((isOpen) => !isOpen)}
        >
          {showAllPresets ? 'Hide' : 'Show more'} presets
          <ChevronDownIcon
            className={cn(
              'size-4 transition-transform',
              showAllPresets && 'rotate-180'
            )}
          />
        </Button>
      )}
      <SliderWithInput
        label='Hue'
        value={adjustment.hueShift}
        min={-180}
        max={180}
        step={1}
        unit='deg'
        onChange={(nextValue) => handleChange('hueShift', nextValue)}
      />
      <SliderWithInput
        label='Saturation'
        value={adjustment.saturationScale}
        min={0}
        max={2}
        step={0.01}
        unit='x'
        onChange={(nextValue) => handleChange('saturationScale', nextValue)}
      />
      <SliderWithInput
        label='Lightness'
        value={adjustment.lightnessScale}
        min={0.2}
        max={2}
        step={0.01}
        unit='x'
        onChange={(nextValue) => handleChange('lightnessScale', nextValue)}
      />
    </div>
  )
}

function ShapeEffectControls({
  currentStyles,
  onChange,
  onReset,
}: {
  currentStyles: Record<string, string>
  onChange: (key: ThemeStyleKey, value: string) => void
  onReset: (key: ThemeStyleKey) => void
}) {
  return (
    <div className='space-y-3'>
      <Collapsible defaultOpen className='group/collapsible'>
        <CollapsibleTrigger className='bg-muted/50 text-muted-foreground hover:bg-muted flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold tracking-wider uppercase transition-colors'>
          <ChevronDownIcon className='size-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90' />
          Radius
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-3'>
          <SliderWithInput
            label='Radius'
            value={parseCssNumber(currentStyles.radius)}
            min={0}
            max={2}
            step={0.01}
            unit='rem'
            onChange={(nextValue) =>
              onChange('radius', formatCssUnit(nextValue, 'rem'))
            }
          />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className='group/collapsible'>
        <CollapsibleTrigger className='bg-muted/50 text-muted-foreground hover:bg-muted flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold tracking-wider uppercase transition-colors'>
          <ChevronDownIcon className='size-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90' />
          Spacing
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-3'>
          <SliderWithInput
            label='Spacing'
            value={parseCssNumber(currentStyles.spacing)}
            min={0}
            max={1}
            step={0.01}
            unit='rem'
            onChange={(nextValue) =>
              onChange('spacing', formatCssUnit(nextValue, 'rem'))
            }
          />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen className='group/collapsible'>
        <CollapsibleTrigger className='bg-muted/50 text-muted-foreground hover:bg-muted flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold tracking-wider uppercase transition-colors'>
          <ChevronDownIcon className='size-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90' />
          Shadow
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2 pt-3'>
          <TokenInput
            label='Color'
            value={currentStyles['shadow-color']}
            common
            color
            onChange={(nextValue) => onChange('shadow-color', nextValue)}
            onReset={() => onReset('shadow-color')}
          />
          <SliderWithInput
            label='Opacity'
            value={parseCssNumber(currentStyles['shadow-opacity'])}
            min={0}
            max={1}
            step={0.01}
            unit=''
            onChange={(nextValue) =>
              onChange('shadow-opacity', String(nextValue))
            }
          />
          <SliderWithInput
            label='Blur'
            value={parseCssNumber(currentStyles['shadow-blur'])}
            min={0}
            max={50}
            step={0.5}
            unit='px'
            onChange={(nextValue) =>
              onChange('shadow-blur', formatCssUnit(nextValue, 'px'))
            }
          />
          <SliderWithInput
            label='Spread'
            value={parseCssNumber(currentStyles['shadow-spread'])}
            min={-50}
            max={50}
            step={0.5}
            unit='px'
            onChange={(nextValue) =>
              onChange('shadow-spread', formatCssUnit(nextValue, 'px'))
            }
          />
          <SliderWithInput
            label='Offset X'
            value={parseCssNumber(currentStyles['shadow-offset-x'])}
            min={-50}
            max={50}
            step={0.5}
            unit='px'
            onChange={(nextValue) =>
              onChange('shadow-offset-x', formatCssUnit(nextValue, 'px'))
            }
          />
          <SliderWithInput
            label='Offset Y'
            value={parseCssNumber(currentStyles['shadow-offset-y'])}
            min={-50}
            max={50}
            step={0.5}
            unit='px'
            onChange={(nextValue) =>
              onChange('shadow-offset-y', formatCssUnit(nextValue, 'px'))
            }
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function TokenInput({
  label,
  value,
  common,
  color,
  onReset,
  onChange,
}: {
  label: string
  value: string
  common?: boolean
  color?: boolean
  onReset?: () => void
  onChange: (value: string) => void
}) {
  return (
    <div className='grid gap-1.5'>
      <div className='flex items-center justify-between gap-2'>
        <Label className='font-mono text-xs'>{label}</Label>
        {common && (
          <span className='text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-[10px]'>
            shared
          </span>
        )}
      </div>
      <div className='flex items-center gap-2'>
        {color && (
          <label className='border-input relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-xs'>
            <span
              className='absolute inset-0'
              style={{ backgroundColor: value }}
            />
            <input
              type='color'
              value={getColorPickerValue(value)}
              className='absolute inset-0 size-full cursor-pointer opacity-0'
              aria-label={`Pick ${label}`}
              onChange={(event) => onChange(event.target.value)}
            />
          </label>
        )}
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className='font-mono text-xs'
        />
        {color && <ColorClassPicker value={value} onChange={onChange} />}
        {onReset && (
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-9 shrink-0'
            onClick={onReset}
          >
            <RotateCcwIcon className='size-4' />
            <span className='sr-only'>Reset {label}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export function ThemeTokenEditor({
  value,
  mode,
  onModeChange,
  onChange,
}: {
  value: ThemeStyles
  mode: ThemeMode
  onModeChange: (mode: ThemeMode) => void
  onChange: (value: ThemeStyles) => void
}) {
  const currentStyles = value[mode]
  const colorGroups = useMemo(() => colorTokenGroups, [])
  const hslBaseStylesRef = useRef<ThemeStyles | null>(null)
  const [hslAdjustment, setHslAdjustment] =
    useState<HslAdjustment>(defaultHslAdjustment)

  const updateToken = (key: ThemeStyleKey, tokenValue: string) => {
    onChange(setThemeStyleValue(value, mode, key, tokenValue))
  }

  const resetToken = (key: ThemeStyleKey) => {
    updateToken(key, defaultThemeStyles[mode][key])
  }

  const updateHslAdjustment = (adjustment: HslAdjustment) => {
    if (!hslBaseStylesRef.current) {
      hslBaseStylesRef.current = {
        light: { ...value.light },
        dark: { ...value.dark },
      }
    }

    setHslAdjustment(adjustment)
    onChange(applyHslAdjustmentToStyles(hslBaseStylesRef.current, adjustment))

    if (isDefaultHslAdjustment(adjustment)) {
      hslBaseStylesRef.current = null
    }
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col rounded-lg border'>
      <div className='flex items-center justify-between gap-3 border-b p-3'>
        <div>
          <p className='text-sm font-medium'>Theme Token Editor</p>
          <p className='text-muted-foreground text-xs'>
            Fine-tune shadcn & Tailwind CSS variables, colors, typography, and
            effects.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='bg-muted/40 flex rounded-md border p-0.5'>
            <Button
              type='button'
              size='sm'
              variant={mode === 'light' ? 'default' : 'ghost'}
              className='h-7 gap-1 px-2 text-xs'
              onClick={() => onModeChange('light')}
            >
              <SunIcon className='size-3.5' />
              <span>Light</span>
            </Button>
            <Button
              type='button'
              size='sm'
              variant={mode === 'dark' ? 'default' : 'ghost'}
              className='h-7 gap-1 px-2 text-xs'
              onClick={() => onModeChange('dark')}
            >
              <MoonIcon className='size-3.5' />
              <span>Dark</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue='colors' className='flex min-h-0 flex-1 flex-col'>
        <div className='border-b p-3'>
          <TabsList className='w-full'>
            <TabsTrigger value='colors'>Colors</TabsTrigger>
            <TabsTrigger value='typography'>Typography</TabsTrigger>
            <TabsTrigger value='effects'>Effects</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='colors' className='m-0 min-h-0 flex-1'>
          <ScrollArea className='h-full'>
            <div className='space-y-3 p-4'>
              {colorGroups.map((group) => (
                <Collapsible
                  key={group.title}
                  defaultOpen={group.defaultOpen}
                  className='group/collapsible'
                >
                  <CollapsibleTrigger className='bg-muted/50 text-muted-foreground hover:bg-muted flex h-8 w-full items-center justify-between gap-1 rounded-md border px-2.5 text-xs font-semibold tracking-wider uppercase transition-colors'>
                    <div className='flex items-center gap-1.5'>
                      <ChevronDownIcon className='size-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90' />
                      <span>{group.title}</span>
                    </div>
                    {group.contrastPair && (
                      <WcagContrastBadge
                        bg={currentStyles[group.contrastPair.bg]}
                        fg={currentStyles[group.contrastPair.fg]}
                      />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className='data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pt-3'>
                    <div className='grid gap-3'>
                      {group.keys.map((key) => (
                        <TokenInput
                          key={key}
                          label={formatTokenLabel(key)}
                          value={currentStyles[key]}
                          common={COMMON_THEME_STYLE_KEYS.includes(key)}
                          color={colorTokenKeys.has(key)}
                          onChange={(nextValue) => updateToken(key, nextValue)}
                          onReset={() =>
                            updateToken(key, defaultThemeStyles[mode][key])
                          }
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value='typography' className='m-0 min-h-0 flex-1'>
          <ScrollArea className='h-full'>
            <div className='space-y-3 p-4'>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <AlertCircleIcon className='size-3.5 shrink-0' />
                <p>
                  Custom fonts require embedding.{' '}
                  <a
                    href='https://tailwindcss.com/docs/font-family'
                    target='_blank'
                    rel='noreferrer'
                    className='text-foreground/70 hover:text-foreground underline underline-offset-2'
                  >
                    Learn more
                  </a>
                </p>
              </div>

              <Collapsible defaultOpen className='group/collapsible'>
                <CollapsibleTrigger className='bg-muted/50 text-muted-foreground hover:bg-muted flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold tracking-wider uppercase transition-colors'>
                  <ChevronDownIcon className='size-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90' />
                  Font Family
                </CollapsibleTrigger>
                <CollapsibleContent className='pt-3'>
                  <div className='space-y-2'>
                    <FontFamilyRow
                      label='Sans-Serif'
                      value={currentStyles['font-sans']}
                      category='sans-serif'
                      placeholder='Sans-serif font...'
                      onChange={(nextValue) =>
                        updateToken('font-sans', nextValue)
                      }
                      onReset={() =>
                        updateToken(
                          'font-sans',
                          defaultThemeStyles[mode]['font-sans']
                        )
                      }
                    />

                    <FontFamilyRow
                      label='Serif'
                      value={currentStyles['font-serif']}
                      category='serif'
                      placeholder='Serif font...'
                      onChange={(nextValue) =>
                        updateToken('font-serif', nextValue)
                      }
                      onReset={() =>
                        updateToken(
                          'font-serif',
                          defaultThemeStyles[mode]['font-serif']
                        )
                      }
                    />

                    <FontFamilyRow
                      label='Mono'
                      value={currentStyles['font-mono']}
                      category='monospace'
                      placeholder='Monospace font...'
                      onChange={(nextValue) =>
                        updateToken('font-mono', nextValue)
                      }
                      onReset={() =>
                        updateToken(
                          'font-mono',
                          defaultThemeStyles[mode]['font-mono']
                        )
                      }
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen className='group/collapsible'>
                <CollapsibleTrigger className='bg-muted/50 text-muted-foreground hover:bg-muted flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold tracking-wider uppercase transition-colors'>
                  <ChevronDownIcon className='size-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90' />
                  Letter Spacing
                </CollapsibleTrigger>
                <CollapsibleContent className='pt-3'>
                  <LetterSpacingControl
                    value={currentStyles['letter-spacing']}
                    onChange={(nextValue) =>
                      updateToken('letter-spacing', nextValue)
                    }
                    onReset={() =>
                      updateToken(
                        'letter-spacing',
                        defaultThemeStyles[mode]['letter-spacing']
                      )
                    }
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value='effects' className='m-0 min-h-0 flex-1'>
          <ScrollArea className='h-full'>
            <div className='space-y-3 p-4'>
              <Collapsible defaultOpen className='group/collapsible'>
                <CollapsibleTrigger className='bg-muted/50 text-muted-foreground hover:bg-muted flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold tracking-wider uppercase transition-colors'>
                  <ChevronDownIcon className='size-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90' />
                  HSL Adjustments
                </CollapsibleTrigger>
                <CollapsibleContent className='pt-3'>
                  <HslAdjustmentControl
                    currentStyles={currentStyles}
                    adjustment={hslAdjustment}
                    onChange={updateHslAdjustment}
                  />
                </CollapsibleContent>
              </Collapsible>

              <ShapeEffectControls
                currentStyles={currentStyles}
                onChange={updateToken}
                onReset={resetToken}
              />

              <div
                className={cn(
                  'bg-card text-card-foreground rounded-md border p-4'
                )}
                style={{
                  borderRadius: currentStyles.radius,
                  padding: `calc(${currentStyles.spacing} * 4)`,
                  boxShadow: getShadowPreview(currentStyles),
                }}
              >
                <p className='font-medium'>Effect sample</p>
                <p className='text-muted-foreground text-sm'>
                  Radius, spacing and shadow tokens are reflected here.
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
