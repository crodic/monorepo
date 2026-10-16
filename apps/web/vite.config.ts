import path from 'path'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readFileSync } from 'fs'
import { defineConfig } from 'vitest/config'

function resolveAppVersion(): string {
  const rootPkgUrl = new URL('../../package.json', import.meta.url)
  const localPkgUrl = new URL('./package.json', import.meta.url)
  const targetUrl = existsSync(rootPkgUrl) ? rootPkgUrl : localPkgUrl
  try {
    const pkg = JSON.parse(readFileSync(targetUrl, 'utf8')) as {
      version?: string
    }
    return pkg.version ?? '1.0.0'
  } catch {
    return '1.0.0'
  }
}

const appVersion = resolveAppVersion()

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.PORT || env.VITE_PORT || 5173)

  return {
    server: {
      port,
    },
    preview: {
      port,
    },
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@tiptap') || id.includes('prosemirror')) {
                return 'vendor-editor'
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts'
              }
              if (id.includes('@radix-ui') || id.includes('radix-ui')) {
                return 'vendor-radix'
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons'
              }
              if (id.includes('@sentry')) {
                return 'vendor-sentry'
              }
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        exclude: [
          'dist/**',
          'coverage/**',
          'node_modules/**',
          'src/main.tsx',
          'src/routes/**',
          'src/**/*.d.ts',
          'src/**/*.config.*',
          'src/**/data/**',
          'src/assets/**',
          'src/i18n/**',
          'src/test/**',
        ],
      },
    },
  }
})
