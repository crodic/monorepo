import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbSegment {
  title: string
  href: string
  isLast: boolean
}

const ROUTE_NAME_MAP: Record<string, string> = {
  admins: 'navigation.management.admins',
  roles: 'navigation.management.roles',
  permissions: 'navigation.management.permissions',
  users: 'navigation.management.users',
  'white-labels': 'navigation.management.whiteLabels',
  files: 'navigation.management.files',
  locations: 'navigation.management.locations',
  'cms-pages': 'navigation.general.cmsPages',
  logs: 'navigation.general.activityLogs',
  'email-logs': 'navigation.general.emailLogs',
  'website-settings': 'navigation.general.website',
  settings: 'settings.title',
  account: 'settings.account.title',
  appearance: 'settings.appearance.title',
  password: 'settings.password.title',
  security: 'settings.security.title',
  create: 'buttons.create',
  edit: 'buttons.edit',
  show: 'buttons.show',
}

function formatSegmentLabel(
  segment: string,
  t: (key: any, defaultValue?: any) => string
): string {
  if (ROUTE_NAME_MAP[segment]) {
    const translated = t(ROUTE_NAME_MAP[segment])
    if (translated && translated !== ROUTE_NAME_MAP[segment]) {
      return translated
    }
  }

  // Format UUID or numeric ID to short ID
  if (/^[0-9a-fA-F-]{8,}$/.test(segment)) {
    return `#${segment.slice(0, 6)}`
  }

  if (/^\d+$/.test(segment)) {
    return `#${segment}`
  }

  // Capitalize kebab-case or camelCase
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function AppBreadcrumb() {
  const { t } = useTranslation()
  const location = useLocation()

  const segments = useMemo<BreadcrumbSegment[]>(() => {
    const rawSegments = location.pathname.split('/').filter(Boolean)
    if (rawSegments.length === 0) {
      return []
    }

    let accumulatedPath = ''
    return rawSegments.map((segment, index) => {
      accumulatedPath += `/${segment}`
      return {
        title: formatSegmentLabel(segment, t),
        href: accumulatedPath,
        isLast: index === rawSegments.length - 1,
      }
    })
  }, [location.pathname, t])

  return (
    <Breadcrumb className='hidden md:flex'>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage>
              {t('navigation.general.dashboard', 'Dashboard')}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to='/'>
                {t('navigation.general.dashboard', 'Dashboard')}
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {segments.map((segment) => (
          <span
            key={segment.href}
            className='inline-flex items-center gap-1.5 sm:gap-2.5'
          >
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {segment.isLast ? (
                <BreadcrumbPage className='font-medium'>
                  {segment.title}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={segment.href}>{segment.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
