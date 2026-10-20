import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ConfigDrawer } from '@/components/config-drawer'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import Loader from '@/components/loader'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { SkipToMain } from '@/components/skip-to-main'
import { ThemeSwitch } from '@/components/theme-switch'
import { NavigationProgress } from '../navigation-progress'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <SearchProvider>
      <LayoutProvider>
        <NavigationProgress />
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              // Enable content container queries
              '@container/content',

              // If layout is fixed, set height to 100dvh to prevent overflow
              'has-data-[layout=fixed]:h-dvh',

              // If layout is fixed and sidebar is inset, set height to 100dvh - spacing
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100dvh-(var(--spacing)*4))]'
            )}
          >
            <Header fixed>
              <div className='ms-auto flex items-center space-x-3 sm:space-x-4'>
                <Search />
                <ThemeSwitch />
                <ConfigDrawer />
                <ProfileDropdown />
              </div>
            </Header>
            <Suspense fallback={<Loader />}>{children ?? <Outlet />}</Suspense>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
