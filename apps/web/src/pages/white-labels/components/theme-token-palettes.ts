import { converter, formatHex, wcagContrast, type Hsl } from 'culori'
import type {
  ThemeMode,
  ThemeStyleKey,
  ThemeStyles,
} from '@/lib/theme-builder/default-theme'

export type HslAdjustment = {
  hueShift: number
  saturationScale: number
  lightnessScale: number
}

export const defaultHslAdjustment: HslAdjustment = {
  hueShift: 0,
  saturationScale: 1,
  lightnessScale: 1,
}

export const hslPresets: (HslAdjustment & { label: string })[] = [
  {
    label: 'Hue (-120deg)',
    hueShift: -120,
    saturationScale: 1,
    lightnessScale: 1,
  },
  {
    label: 'Hue (-60deg)',
    hueShift: -60,
    saturationScale: 1,
    lightnessScale: 1,
  },
  {
    label: 'Hue (+60deg)',
    hueShift: 60,
    saturationScale: 1,
    lightnessScale: 1,
  },
  {
    label: 'Hue (+120deg)',
    hueShift: 120,
    saturationScale: 1,
    lightnessScale: 1,
  },
  { label: 'Hue invert', hueShift: 180, saturationScale: 1, lightnessScale: 1 },
  { label: 'Grayscale', hueShift: 0, saturationScale: 0, lightnessScale: 1 },
  { label: 'Muted', hueShift: 0, saturationScale: 0.6, lightnessScale: 1 },
  { label: 'Vibrant', hueShift: 0, saturationScale: 1.4, lightnessScale: 1 },
  { label: 'Dimmer', hueShift: 0, saturationScale: 1, lightnessScale: 0.8 },
  { label: 'Brighter', hueShift: 0, saturationScale: 1, lightnessScale: 1.2 },
  {
    label: 'Warm soft',
    hueShift: 30,
    saturationScale: 0.5,
    lightnessScale: 0.95,
  },
  {
    label: 'Cool vivid',
    hueShift: -20,
    saturationScale: 1.2,
    lightnessScale: 1.05,
  },
  {
    label: 'Fresh muted',
    hueShift: 20,
    saturationScale: 0.7,
    lightnessScale: 0.95,
  },
  {
    label: 'Soft lift',
    hueShift: -10,
    saturationScale: 0.75,
    lightnessScale: 1.1,
  },
  {
    label: 'Bright pop',
    hueShift: 60,
    saturationScale: 1.5,
    lightnessScale: 1.1,
  },
]

export type FontCategory =
  'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting'

export type FontInfo = {
  family: string
  category: FontCategory
  variable?: boolean
}

export const fontCategoryLabels: Record<FontCategory, string> = {
  'sans-serif': 'Sans Serif Fonts',
  serif: 'Serif Fonts',
  monospace: 'Mono Fonts',
  display: 'Display Fonts',
  handwriting: 'Handwriting Fonts',
}

export const systemFontFallbacks: Record<FontCategory, string> = {
  'sans-serif': 'ui-sans-serif, sans-serif, system-ui',
  serif: 'ui-serif, serif',
  monospace: 'ui-monospace, monospace',
  display: 'ui-serif, serif',
  handwriting: 'cursive',
}

export const popularFonts: FontInfo[] = [
  { family: 'Inter', category: 'sans-serif', variable: true },
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Open Sans', category: 'sans-serif', variable: true },
  { family: 'Poppins', category: 'sans-serif' },
  { family: 'Montserrat', category: 'sans-serif', variable: true },
  { family: 'Lato', category: 'sans-serif' },
  { family: 'Nunito', category: 'sans-serif', variable: true },
  { family: 'Raleway', category: 'sans-serif', variable: true },
  { family: 'DM Sans', category: 'sans-serif', variable: true },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', variable: true },
  { family: 'Geist', category: 'sans-serif', variable: true },
  { family: 'Chakra Petch', category: 'sans-serif' },
  { family: 'Playfair Display', category: 'serif', variable: true },
  { family: 'Merriweather', category: 'serif' },
  { family: 'Lora', category: 'serif', variable: true },
  { family: 'PT Serif', category: 'serif' },
  { family: 'Noto Serif', category: 'serif', variable: true },
  { family: 'Source Serif 4', category: 'serif', variable: true },
  { family: 'Libre Baskerville', category: 'serif' },
  { family: 'EB Garamond', category: 'serif', variable: true },
  { family: 'Crimson Text', category: 'serif' },
  { family: 'Bitter', category: 'serif', variable: true },
  { family: 'JetBrains Mono', category: 'monospace', variable: true },
  { family: 'Fira Code', category: 'monospace', variable: true },
  { family: 'Source Code Pro', category: 'monospace', variable: true },
  { family: 'Roboto Mono', category: 'monospace', variable: true },
  { family: 'IBM Plex Mono', category: 'monospace' },
  { family: 'Space Mono', category: 'monospace' },
  { family: 'Ubuntu Mono', category: 'monospace' },
  { family: 'Inconsolata', category: 'monospace', variable: true },
  { family: 'Geist Mono', category: 'monospace', variable: true },
  { family: 'Bebas Neue', category: 'display' },
  { family: 'Abril Fatface', category: 'display' },
  { family: 'Righteous', category: 'display' },
  { family: 'Fredoka', category: 'display', variable: true },
  { family: 'Lobster', category: 'display' },
  { family: 'Comfortaa', category: 'display', variable: true },
  { family: 'Dancing Script', category: 'handwriting', variable: true },
  { family: 'Pacifico', category: 'handwriting' },
  { family: 'Caveat', category: 'handwriting', variable: true },
  { family: 'Satisfy', category: 'handwriting' },
  { family: 'Great Vibes', category: 'handwriting' },
]

export const colorTokenGroups: {
  title: string
  defaultOpen?: boolean
  keys: ThemeStyleKey[]
  contrastPair?: { bg: ThemeStyleKey; fg: ThemeStyleKey }
}[] = [
  {
    title: 'Primary',
    defaultOpen: true,
    keys: ['primary', 'primary-foreground'],
    contrastPair: { bg: 'primary', fg: 'primary-foreground' },
  },
  {
    title: 'Secondary',
    defaultOpen: true,
    keys: ['secondary', 'secondary-foreground'],
    contrastPair: { bg: 'secondary', fg: 'secondary-foreground' },
  },
  {
    title: 'Accent',
    defaultOpen: true,
    keys: ['accent', 'accent-foreground'],
    contrastPair: { bg: 'accent', fg: 'accent-foreground' },
  },
  {
    title: 'Base',
    defaultOpen: true,
    keys: ['background', 'foreground'],
    contrastPair: { bg: 'background', fg: 'foreground' },
  },
  {
    title: 'Card',
    keys: ['card', 'card-foreground'],
    contrastPair: { bg: 'card', fg: 'card-foreground' },
  },
  {
    title: 'Popover',
    keys: ['popover', 'popover-foreground'],
    contrastPair: { bg: 'popover', fg: 'popover-foreground' },
  },
  {
    title: 'Muted',
    keys: ['muted', 'muted-foreground'],
    contrastPair: { bg: 'muted', fg: 'muted-foreground' },
  },
  {
    title: 'Destructive',
    keys: ['destructive'],
  },
  {
    title: 'Border',
    keys: ['border', 'input', 'ring'],
  },
  {
    title: 'Charts',
    keys: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
  },
  {
    title: 'Sidebar',
    keys: [
      'sidebar',
      'sidebar-foreground',
      'sidebar-primary',
      'sidebar-primary-foreground',
      'sidebar-accent',
      'sidebar-accent-foreground',
      'sidebar-border',
      'sidebar-ring',
    ],
    contrastPair: { bg: 'sidebar', fg: 'sidebar-foreground' },
  },
]

export const tailwindColors = [
  ['slate-50', '#f8fafc'],
  ['slate-100', '#f1f5f9'],
  ['slate-200', '#e2e8f0'],
  ['slate-300', '#cbd5e1'],
  ['slate-400', '#94a3b8'],
  ['slate-500', '#64748b'],
  ['slate-600', '#475569'],
  ['slate-700', '#334155'],
  ['slate-800', '#1e293b'],
  ['slate-900', '#0f172a'],
  ['slate-950', '#020617'],
  ['neutral-50', '#fafafa'],
  ['neutral-100', '#f5f5f5'],
  ['neutral-200', '#e5e5e5'],
  ['neutral-300', '#d4d4d4'],
  ['neutral-400', '#a3a3a3'],
  ['neutral-500', '#737373'],
  ['neutral-600', '#525252'],
  ['neutral-700', '#404040'],
  ['neutral-800', '#262626'],
  ['neutral-900', '#171717'],
  ['neutral-950', '#0a0a0a'],
  ['red-100', '#fee2e2'],
  ['red-300', '#fca5a5'],
  ['red-500', '#ef4444'],
  ['red-700', '#b91c1c'],
  ['red-900', '#7f1d1d'],
  ['orange-100', '#ffedd5'],
  ['orange-300', '#fdba74'],
  ['orange-500', '#f97316'],
  ['orange-700', '#c2410c'],
  ['orange-900', '#7c2d12'],
  ['amber-100', '#fef3c7'],
  ['amber-300', '#fcd34d'],
  ['amber-500', '#f59e0b'],
  ['amber-700', '#b45309'],
  ['amber-900', '#78350f'],
  ['yellow-100', '#fef9c3'],
  ['yellow-300', '#fde047'],
  ['yellow-500', '#eab308'],
  ['yellow-700', '#a16207'],
  ['yellow-900', '#713f12'],
  ['green-100', '#dcfce7'],
  ['green-300', '#86efac'],
  ['green-500', '#22c55e'],
  ['green-700', '#15803d'],
  ['green-900', '#14532d'],
  ['teal-100', '#ccfbf1'],
  ['teal-300', '#5eead4'],
  ['teal-500', '#14b8a6'],
  ['teal-700', '#0f766e'],
  ['teal-900', '#134e4a'],
  ['cyan-100', '#cffafe'],
  ['cyan-300', '#67e8f9'],
  ['cyan-500', '#06b6d4'],
  ['cyan-700', '#0e7490'],
  ['cyan-900', '#164e63'],
  ['sky-100', '#e0f2fe'],
  ['sky-300', '#7dd3fc'],
  ['sky-500', '#0ea5e9'],
  ['sky-700', '#0369a1'],
  ['sky-900', '#0c4a6e'],
  ['blue-100', '#dbeafe'],
  ['blue-300', '#93c5fd'],
  ['blue-500', '#3b82f6'],
  ['blue-700', '#1d4ed8'],
  ['blue-900', '#1e3a8a'],
  ['indigo-100', '#e0e7ff'],
  ['indigo-300', '#a5b4fc'],
  ['indigo-500', '#6366f1'],
  ['indigo-700', '#4338ca'],
  ['indigo-900', '#312e81'],
  ['violet-100', '#ede9fe'],
  ['violet-300', '#c4b5fd'],
  ['violet-500', '#8b5cf6'],
  ['violet-700', '#6d28d9'],
  ['violet-900', '#4c1d95'],
  ['purple-100', '#f3e8ff'],
  ['purple-300', '#d8b4fe'],
  ['purple-500', '#a855f7'],
  ['purple-700', '#7e22ce'],
  ['purple-900', '#581c87'],
  ['pink-100', '#fce7f3'],
  ['pink-300', '#f9a8d4'],
  ['pink-500', '#ec4899'],
  ['pink-700', '#be185d'],
  ['pink-900', '#831843'],
  ['rose-100', '#ffe4e6'],
  ['rose-300', '#fda4af'],
  ['rose-500', '#f43f5e'],
  ['rose-700', '#be123c'],
  ['rose-900', '#881337'],
] as const

export const colorInputPattern = /^#[0-9a-f]{6}$/i
export const colorTokenKeys = new Set<ThemeStyleKey>(
  colorTokenGroups.flatMap((group) => group.keys)
)

export function getContrastRatio(bg?: string, fg?: string): number | null {
  if (!bg || !fg) return null
  try {
    const ratio = wcagContrast(bg, fg)
    return typeof ratio === 'number' && !isNaN(ratio) ? ratio : null
  } catch {
    return null
  }
}

export function buildFontFamily(fontFamily: string, category: FontCategory) {
  return `${fontFamily}, ${systemFontFallbacks[category]}`
}

export function extractFontFamily(fontFamilyValue: string) {
  if (!fontFamilyValue) return null

  const firstFont = fontFamilyValue.split(',')[0]?.trim().replace(/['"]/g, '')
  if (!firstFont) return null

  const systemFonts = [
    'ui-sans-serif',
    'ui-serif',
    'ui-monospace',
    'system-ui',
    'sans-serif',
    'serif',
    'monospace',
    'cursive',
    'fantasy',
  ]

  return systemFonts.includes(firstFont.toLowerCase()) ? null : firstFont
}

export function getFontCssUrl(family: string) {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@400;500;600;700&display=swap`
}

export function loadGoogleFont(family: string) {
  if (typeof document === 'undefined') return

  const href = getFontCssUrl(family)
  if (document.querySelector(`link[href="${href}"]`)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

export function formatTokenLabel(key: ThemeStyleKey) {
  const suffixes = ['-foreground', '-primary-foreground', '-accent-foreground']
  const simplified = suffixes.reduce(
    (label, suffix) => label.replace(suffix, ' foreground'),
    key
  )

  return simplified
    .split(/[-\s]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

export function parseEmValue(value: string) {
  const numeric = Number.parseFloat(value.replace('em', '').trim())
  return Number.isFinite(numeric) ? numeric : 0
}

export function formatEmValue(value: number) {
  return `${Number(value.toFixed(3))}em`
}

export function parseCssNumber(value: string) {
  const numeric = Number.parseFloat(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

export function formatCssUnit(value: number, unit: string) {
  return `${Number(value.toFixed(3))}${unit}`
}

export function adjustColorByHsl(
  color: string,
  hueShift: number,
  saturationScale: number,
  lightnessScale: number
) {
  const hsl = converter('hsl')(color)
  const h = hsl?.h
  const s = hsl?.s
  const l = hsl?.l

  if (h === undefined || s === undefined || l === undefined) return color

  const out = converter('hsl')({
    h: (((h + hueShift) % 360) + 360) % 360,
    s: Math.min(1, Math.max(0, s * saturationScale)),
    l: Math.min(1, Math.max(0.1, l * lightnessScale)),
  } as Hsl)

  return out ? formatHex(out) : color
}

export function isDefaultHslAdjustment(adjustment: HslAdjustment) {
  return (
    adjustment.hueShift === defaultHslAdjustment.hueShift &&
    adjustment.saturationScale === defaultHslAdjustment.saturationScale &&
    adjustment.lightnessScale === defaultHslAdjustment.lightnessScale
  )
}

export function getShadowPreview(styles: Record<string, string>) {
  const color = styles['shadow-color'] || 'oklch(0 0 0)'
  const opacity = parseCssNumber(styles['shadow-opacity'])
  const blur = styles['shadow-blur'] || '3px'
  const spread = styles['shadow-spread'] || '0px'
  const offsetX = styles['shadow-offset-x'] || '0px'
  const offsetY = styles['shadow-offset-y'] || '1px'

  return `${offsetX} ${offsetY} ${blur} ${spread} color-mix(in oklch, ${color} ${opacity * 100}%, transparent)`
}

export function applyHslAdjustmentToStyles(
  styles: ThemeStyles,
  adjustment: HslAdjustment
) {
  const next: ThemeStyles = {
    light: { ...styles.light },
    dark: { ...styles.dark },
  }

  ;(['light', 'dark'] as ThemeMode[]).forEach((themeMode) => {
    colorTokenGroups.forEach((group) => {
      group.keys.forEach((key) => {
        next[themeMode][key] = adjustColorByHsl(
          styles[themeMode][key],
          adjustment.hueShift,
          adjustment.saturationScale,
          adjustment.lightnessScale
        )
      })
    })
  })

  return next
}

export function getColorPickerValue(value: string) {
  return colorInputPattern.test(value) ? value : '#000000'
}
