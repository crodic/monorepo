import type { ThemeMode, ThemeStyles } from '@/lib/theme-builder/default-theme'
import { themeRuntimeEngine, type RuntimeTheme } from './theme-runtime-engine'

/**
 * Enterprise Runtime Theme System
 * Re-exports the unified ThemeRuntimeEngine for white-label styling, caching, and token management.
 */

export * from './theme-runtime-engine'

export function isRuntimeTheme(value: unknown): value is RuntimeTheme {
  return themeRuntimeEngine.isRuntimeTheme(value)
}

export function ensureThemeCacheVersion(): void {
  themeRuntimeEngine.ensureThemeCacheVersion()
}

export function getCachedRuntimeTheme(): RuntimeTheme | null {
  return themeRuntimeEngine.getCachedRuntimeTheme()
}

export function setCachedRuntimeTheme(theme: RuntimeTheme | null): void {
  themeRuntimeEngine.setCachedRuntimeTheme(theme)
}

export function clearCachedRuntimeTheme(): void {
  themeRuntimeEngine.clearCachedRuntimeTheme()
}

export function applyRuntimeThemeStyles(
  styles: ThemeStyles,
  mode: ThemeMode
): void {
  themeRuntimeEngine.applyRuntimeThemeStyles(styles, mode)
}

export function applyRuntimeThemeFont(
  styles: ThemeStyles,
  mode: ThemeMode
): void {
  themeRuntimeEngine.applyRuntimeThemeFont(styles, mode)
}

export function clearRuntimeThemeStyles(): void {
  themeRuntimeEngine.clearRuntimeThemeStyles()
}

export function getCurrentThemeMode(): ThemeMode {
  return themeRuntimeEngine.getCurrentThemeMode()
}

export function applyRuntimeTheme(theme: RuntimeTheme | null): void {
  themeRuntimeEngine.applyRuntimeTheme(theme)
}

export function hasPersonalThemeColor(): boolean {
  return themeRuntimeEngine.hasPersonalThemeColor()
}

export function fetchRuntimeTheme(
  target: 'admin' | 'client' = 'admin'
): Promise<RuntimeTheme | null> {
  return themeRuntimeEngine.fetchRuntimeTheme(target)
}

export function initThemeSyncListener(
  onThemeChange: (theme: RuntimeTheme | null) => void
): () => void {
  return themeRuntimeEngine.initThemeSyncListener(onThemeChange)
}
