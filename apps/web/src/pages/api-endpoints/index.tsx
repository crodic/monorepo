import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'
import { Columns2, LayoutList, Zap } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import http from '@/lib/http'
import { useTheme } from '@/context/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Main } from '@/components/layout/main'

export function PageApiEndpoints() {
  const [layout, setLayout] = useState<'classic' | 'modern'>('classic')
  const { resolvedTheme } = useTheme()
  const accessToken = useAuthStore((s) => s.meta.accessToken)

  const {
    data: spec,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['developer', 'openapi-spec'],
    queryFn: async () => {
      const res = await http.get('/developer/openapi-spec')
      return res.data
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  if (isPending) {
    return (
      <Main className='flex h-[60vh] items-center justify-center'>
        <div className='text-muted-foreground flex items-center gap-3 text-sm'>
          <Spinner className='size-5' />
          <span>Loading Scalar API Reference...</span>
        </div>
      </Main>
    )
  }

  if (isError || !spec) {
    return (
      <Main className='p-6'>
        <div className='border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-4'>
          <p className='font-semibold'>Error loading API documentation</p>
          <p className='text-sm'>
            {(error as any)?.message || 'Failed to load OpenAPI specification'}
          </p>
        </div>
      </Main>
    )
  }

  return (
    <div className='flex min-h-[calc(100vh-4rem)] w-full flex-col'>
      {/* Top Bar with Layout Selector */}
      <div className='bg-background/80 flex items-center justify-between border-b px-6 py-2.5 backdrop-blur-xs'>
        <div className='flex items-center gap-2.5'>
          <div className='bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md'>
            <Zap className='size-4' />
          </div>
          <span className='text-sm font-semibold'>API Reference</span>
          <Badge variant='outline' className='font-mono text-[10px]'>
            v{spec?.info?.version || '1.0.0'}
          </Badge>
        </div>

        <div className='bg-muted/40 flex items-center gap-1 rounded-lg border p-1'>
          <Button
            type='button'
            variant={layout === 'classic' ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => setLayout('classic')}
            className='h-7 gap-1.5 px-2.5 text-xs font-medium'
          >
            <LayoutList className='size-3.5' />
            <span>Classic (Aligned)</span>
          </Button>
          <Button
            type='button'
            variant={layout === 'modern' ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => setLayout('modern')}
            className='h-7 gap-1.5 px-2.5 text-xs font-medium'
          >
            <Columns2 className='size-3.5' />
            <span>Modern (Split)</span>
          </Button>
        </div>
      </div>

      {/* Scalar Container */}
      <div className='bg-card w-full flex-1 overflow-hidden'>
        <ApiReferenceReact
          key={layout}
          configuration={{
            spec: {
              content: spec,
            },
            layout,
            theme: 'default',
            darkMode: resolvedTheme === 'dark',
            showSidebar: true,
            searchHotKey: 'k',
            authentication: {
              preferredSecurityScheme: 'JWT-auth',
              securitySchemes: {
                'JWT-auth': {
                  token: accessToken || '',
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

export default PageApiEndpoints
