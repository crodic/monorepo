import { wcagContrast } from 'culori'
import { applyPersonalFontPreference } from '@/lib/personal-font'
import type { ThemeMode, ThemeStyles } from '@/lib/theme-builder/default-theme'
import { THEME_STYLE_KEYS } from '@/lib/theme-builder/default-theme'

export const THEME_CACHE_VERSION = 'v1.0.0'
export const THEME_VERSION_STORAGE_KEY = 'theme-cache-version'
export const RUNTIME_THEME_STORAGE_KEY = 'runtime-theme:admin'
export const ADMIN_RUNTIME_THEME_STORAGE_KEY = 'runtime-theme:admin'
export const PERSONAL_THEME_COLOR_STORAGE_KEY = 'theme-color'
export const WHITE_LABEL_ACTIVE_STORAGE_KEY = 'active-white-label:admin'

export type RuntimeTheme = {
  id: string
  styles: ThemeStyles
  updatedAt?: string
}

export interface ContrastAuditPair {
  name: string
  ratio: number
  passesAA: boolean
}

export interface ContrastAuditResult {
  isCompliant: boolean
  pairs: ContrastAuditPair[]
}

/**
 * Enterprise Runtime Theme Engine for multi-tenant white-label styling.
 * Encapsulates versioned local caching, dynamic Google Fonts injection,
 * root CSS custom property binding, storage synchronization, and WCAG contrast auditing.
 */
export class ThemeRuntimeEngine {
  private cacheVersion = THEME_CACHE_VERSION

  public isRuntimeTheme(value: unknown): value is RuntimeTheme {
    if (!value || typeof value !== 'object') return false
    const theme = value as RuntimeTheme
    return ['light', 'dark'].every((mode) => {
      const styles = theme.styles?.[mode as ThemeMode]
      return (
        !!styles &&
        typeof styles === 'object' &&
        THEME_STYLE_KEYS.every(
          (key) => typeof styles[key] === 'string' && styles[key].length > 0
        )
      )
    })
  }

  public ensureThemeCacheVersion(): void {
    try {
      const currentVersion = localStorage.getItem(THEME_VERSION_STORAGE_KEY)
      if (currentVersion !== this.cacheVersion) {
        localStorage.removeItem(ADMIN_RUNTIME_THEME_STORAGE_KEY)
        localStorage.removeItem('runtime-theme:current')
        localStorage.removeItem(WHITE_LABEL_ACTIVE_STORAGE_KEY)
        localStorage.removeItem('active-white-label')
        localStorage.setItem(THEME_VERSION_STORAGE_KEY, this.cacheVersion)
      }
    } catch {
      // Gracefully handle localStorage disabled or private browsing mode
    }
  }

  public getCachedRuntimeTheme(): RuntimeTheme | null {
    this.ensureThemeCacheVersion()
    try {
      const raw = localStorage.getItem(ADMIN_RUNTIME_THEME_STORAGE_KEY)
      const theme = raw ? JSON.parse(raw) : null
      if (!theme) return null
      if (this.isRuntimeTheme(theme)) return theme

      this.clearCachedRuntimeTheme()
      return null
    } catch {
      this.clearCachedRuntimeTheme()
      return null
    }
  }

  public setCachedRuntimeTheme(theme: RuntimeTheme | null): void {
    if (!theme) {
      this.clearCachedRuntimeTheme()
      return
    }
    localStorage.setItem(ADMIN_RUNTIME_THEME_STORAGE_KEY, JSON.stringify(theme))
    localStorage.setItem(THEME_VERSION_STORAGE_KEY, this.cacheVersion)
  }

  public clearCachedRuntimeTheme(): void {
    localStorage.removeItem(ADMIN_RUNTIME_THEME_STORAGE_KEY)
    localStorage.removeItem('runtime-theme:current')
  }

  public extractFontFamily(fontFamilyValue: string): string | null {
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

  public loadGoogleFont(fontFamily: string): void {
    const family = this.extractFontFamily(fontFamily)
    if (!family) return

    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@400;500;600;700&display=swap`

    if (document.querySelector(`link[href="${href}"]`)) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }

  public loadThemeFonts(styles: ThemeStyles, mode: ThemeMode): void {
    ;(['font-sans', 'font-serif', 'font-mono'] as const).forEach((key) => {
      this.loadGoogleFont(styles[mode][key])
    })
  }

  public applyRuntimeThemeStyles(styles: ThemeStyles, mode: ThemeMode): void {
    this.loadThemeFonts(styles, mode)
    const root = document.documentElement
    THEME_STYLE_KEYS.forEach((key) => {
      root.style.setProperty(`--${key}`, styles[mode][key])
    })
    root.style.fontFamily = styles[mode]['font-sans']
  }

  public applyRuntimeThemeFont(styles: ThemeStyles, mode: ThemeMode): void {
    this.loadThemeFonts(styles, mode)
    const root = document.documentElement
    root.style.setProperty('--font-sans', styles[mode]['font-sans'])
    root.style.setProperty('--font-serif', styles[mode]['font-serif'])
    root.style.setProperty('--font-mono', styles[mode]['font-mono'])
    root.style.fontFamily = styles[mode]['font-sans']
  }

  public clearRuntimeThemeStyles(): void {
    const root = document.documentElement
    THEME_STYLE_KEYS.forEach((key) => {
      root.style.removeProperty(`--${key}`)
    })
    applyPersonalFontPreference()
  }

  public getCurrentThemeMode(): ThemeMode {
    return document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  }

  public applyRuntimeTheme(theme: RuntimeTheme | null): void {
    if (!theme?.styles) return
    this.applyRuntimeThemeStyles(theme.styles, this.getCurrentThemeMode())
  }

  public hasPersonalThemeColor(): boolean {
    return localStorage.getItem(PERSONAL_THEME_COLOR_STORAGE_KEY) !== null
  }

  public async fetchRuntimeTheme(
    target: 'admin' | 'client' = 'admin'
  ): Promise<RuntimeTheme | null> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/white-labels/active?target=${target}`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) return null
      const theme = (await response.json()) as RuntimeTheme | null
      if (this.isRuntimeTheme(theme)) {
        this.setCachedRuntimeTheme(theme)
        return theme
      }
      return null
    } catch {
      return null
    }
  }

  public initThemeSyncListener(
    onThemeChange: (theme: RuntimeTheme | null) => void
  ): () => void {
    const handler = (event: StorageEvent) => {
      if (
        event.key === ADMIN_RUNTIME_THEME_STORAGE_KEY ||
        event.key === THEME_VERSION_STORAGE_KEY ||
        event.key === 'vite-ui-white-label-enabled'
      ) {
        const updatedTheme = this.getCachedRuntimeTheme()
        onThemeChange(updatedTheme)
      }
    }

    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }

  /**
   * Evaluates the color tokens of a theme mode against WCAG 2.1 AA (4.5:1 ratio minimum).
   */
  public auditContrast(
    styles: ThemeStyles,
    mode: ThemeMode
  ): ContrastAuditResult {
    const currentStyles = styles[mode]
    const pairsToCheck = [
      {
        name: 'Primary / Foreground',
        fg: currentStyles['primary-foreground'],
        bg: currentStyles['primary'],
      },
      {
        name: 'Secondary / Foreground',
        fg: currentStyles['secondary-foreground'],
        bg: currentStyles['secondary'],
      },
      {
        name: 'Accent / Foreground',
        fg: currentStyles['accent-foreground'],
        bg: currentStyles['accent'],
      },
      {
        name: 'Background / Foreground',
        fg: currentStyles['foreground'],
        bg: currentStyles['background'],
      },
      {
        name: 'Card / Foreground',
        fg: currentStyles['card-foreground'],
        bg: currentStyles['card'],
      },
      {
        name: 'Muted / Foreground',
        fg: currentStyles['muted-foreground'],
        bg: currentStyles['muted'],
      },
    ]

    const pairs = pairsToCheck.map(({ name, fg, bg }) => {
      try {
        const ratio = wcagContrast(fg, bg) || 1
        return {
          name,
          ratio: Math.round(ratio * 100) / 100,
          passesAA: ratio >= 4.5,
        }
      } catch {
        return { name, ratio: 1, passesAA: false }
      }
    })

    const isCompliant = pairs.every((p) => p.passesAA)
    return { isCompliant, pairs }
  }
}

export const themeRuntimeEngine = new ThemeRuntimeEngine()
