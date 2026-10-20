import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AppBreadcrumb } from './app-breadcrumb'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({
  className,
  fixed = true,
  children,
  ...props
}: HeaderProps) {
  return (
    <header
      className={cn(
        'border-border/40 bg-background/80 z-40 h-16 w-full border-b backdrop-blur-md transition-colors',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        className
      )}
      {...props}
    >
      <div className='flex h-full items-center gap-3 px-4 sm:gap-4 sm:px-6'>
        <SidebarTrigger variant='outline' className='max-md:scale-110' />
        <Separator orientation='vertical' className='h-6' />
        <AppBreadcrumb />
        {children}
      </div>
    </header>
  )
}
