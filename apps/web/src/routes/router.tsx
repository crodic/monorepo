import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  type RouteObject,
} from 'react-router'
import { SetupGuard } from '@/components/layout/setup-guard'
import Loader from '@/components/loader'
import { GeneralError } from '@/pages/errors/general-error'
import ProtectedRoutes from './protected-route'
import { RouteAuthorize } from './route-authorized'

const PageActivityLogOverview = lazy(() =>
  import('@/pages/activity-log').then((m) => ({
    default: m.PageActivityLogOverview,
  }))
)
const PageActivityLogShow = lazy(() => import('@/pages/activity-log/show'))
const PageApiEndpoints = lazy(() =>
  import('@/pages/api-endpoints').then((m) => ({
    default: m.PageApiEndpoints,
  }))
)
const PageAdminOverview = lazy(() =>
  import('@/pages/admins').then((m) => ({ default: m.PageAdminOverview }))
)
const PageAdminCreate = lazy(() =>
  import('@/pages/admins/create').then((m) => ({ default: m.PageAdminCreate }))
)
const PageAdminEdit = lazy(() =>
  import('@/pages/admins/edit').then((m) => ({ default: m.PageAdminEdit }))
)
const PageAdminShow = lazy(() =>
  import('@/pages/admins/show').then((m) => ({ default: m.PageAdminShow }))
)
const ForgotPassword = lazy(() =>
  import('@/pages/auth/forgot-password').then((m) => ({
    default: m.ForgotPassword,
  }))
)
const ResetPassword = lazy(() =>
  import('@/pages/auth/reset-password').then((m) => ({
    default: m.ResetPassword,
  }))
)
const SignIn = lazy(() =>
  import('@/pages/auth/sign-in').then((m) => ({ default: m.SignIn }))
)
const PageCmsPageOverview = lazy(() =>
  import('@/pages/cms-pages').then((m) => ({ default: m.PageCmsPageOverview }))
)
const PageCmsPageCreate = lazy(() =>
  import('@/pages/cms-pages/create').then((m) => ({
    default: m.PageCmsPageCreate,
  }))
)
const PageCmsPageEdit = lazy(() =>
  import('@/pages/cms-pages/edit').then((m) => ({ default: m.PageCmsPageEdit }))
)
const PageCmsPageShow = lazy(() =>
  import('@/pages/cms-pages/show').then((m) => ({ default: m.PageCmsPageShow }))
)
const Dashboard = lazy(() =>
  import('@/pages/dashboard').then((m) => ({ default: m.Dashboard }))
)
const PageEmailLogOverview = lazy(() =>
  import('@/pages/email-logs').then((m) => ({
    default: m.PageEmailLogOverview,
  }))
)
const PageEmailLogShow = lazy(() => import('@/pages/email-logs/show'))
const ForbiddenError = lazy(() =>
  import('@/pages/errors/forbidden').then((m) => ({
    default: m.ForbiddenError,
  }))
)
const MaintenanceError = lazy(() =>
  import('@/pages/errors/maintenance-error').then((m) => ({
    default: m.MaintenanceError,
  }))
)
const NotFoundError = lazy(() =>
  import('@/pages/errors/not-found-error').then((m) => ({
    default: m.NotFoundError,
  }))
)
const UnauthorizedError = lazy(() =>
  import('@/pages/errors/unauthorized-error').then((m) => ({
    default: m.UnauthorizedError,
  }))
)
const PageFileOverview = lazy(() =>
  import('@/pages/files').then((m) => ({ default: m.PageFileOverview }))
)
const PageHelpCenter = lazy(() =>
  import('@/pages/help-center').then((m) => ({ default: m.PageHelpCenter }))
)
const PageLocationOverview = lazy(() =>
  import('@/pages/locations').then((m) => ({
    default: m.PageLocationOverview,
  }))
)
const PagePermissionOverview = lazy(() =>
  import('@/pages/permissions').then((m) => ({
    default: m.PagePermissionOverview,
  }))
)
const PagePermissionEdit = lazy(() =>
  import('@/pages/permissions/edit').then((m) => ({
    default: m.PagePermissionEdit,
  }))
)
const PagePermissionShow = lazy(() => import('@/pages/permissions/show'))
const PageRoleOverview = lazy(() =>
  import('@/pages/roles').then((m) => ({ default: m.PageRoleOverview }))
)
const PageRoleCreate = lazy(() => import('@/pages/roles/create'))
const PageRoleEdit = lazy(() =>
  import('@/pages/roles/edit').then((m) => ({ default: m.PageRoleEdit }))
)
const PageRoleShow = lazy(() => import('@/pages/roles/show'))
const Settings = lazy(() =>
  import('@/pages/settings').then((m) => ({ default: m.Settings }))
)
const SettingsAccount = lazy(() =>
  import('@/pages/settings/account').then((m) => ({
    default: m.SettingsAccount,
  }))
)
const SettingsAppearance = lazy(() =>
  import('@/pages/settings/appearance').then((m) => ({
    default: m.SettingsAppearance,
  }))
)
const SettingsDisplay = lazy(() =>
  import('@/pages/settings/display').then((m) => ({
    default: m.SettingsDisplay,
  }))
)
const SettingsPassword = lazy(() =>
  import('@/pages/settings/password').then((m) => ({
    default: m.SettingsPassword,
  }))
)
const SettingsProfile = lazy(() =>
  import('@/pages/settings/profile').then((m) => ({
    default: m.SettingsProfile,
  }))
)
const SettingsSecurity = lazy(() =>
  import('@/pages/settings/security').then((m) => ({
    default: m.SettingsSecurity,
  }))
)
const SettingsWebsite = lazy(() =>
  import('@/pages/settings/website').then((m) => ({
    default: m.SettingsWebsite,
  }))
)
const PageSystemSetup = lazy(() =>
  import('@/pages/setup').then((m) => ({ default: m.PageSystemSetup }))
)
const PageUserOverview = lazy(() =>
  import('@/pages/users').then((m) => ({ default: m.PageUserOverview }))
)
const PageUserCreate = lazy(() =>
  import('@/pages/users/create').then((m) => ({ default: m.PageUserCreate }))
)
const PageUserEdit = lazy(() =>
  import('@/pages/users/edit').then((m) => ({ default: m.PageUserEdit }))
)
const PageUserShow = lazy(() =>
  import('@/pages/users/show').then((m) => ({ default: m.PageUserShow }))
)
const PageWhiteLabelOverview = lazy(() =>
  import('@/pages/white-labels').then((m) => ({
    default: m.PageWhiteLabelOverview,
  }))
)
const PageWhiteLabelCreate = lazy(() =>
  import('@/pages/white-labels/create').then((m) => ({
    default: m.PageWhiteLabelCreate,
  }))
)
const PageWhiteLabelEdit = lazy(() =>
  import('@/pages/white-labels/edit').then((m) => ({
    default: m.PageWhiteLabelEdit,
  }))
)
const PageWhiteLabelShow = lazy(() => import('@/pages/white-labels/show'))

const appRoutes: RouteObject[] = [
  {
    path: '/sign-in',
    element: (
      <Suspense fallback={<Loader />}>
        <SignIn />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<Loader />}>
        <ForgotPassword />
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<Loader />}>
        <ResetPassword />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoutes />,
    errorElement: <GeneralError />,
    children: [
      {
        index: true,
        element: (
          <RouteAuthorize isAnyPermission>
            <Dashboard />
          </RouteAuthorize>
        ),
      },
      {
        path: '/admins',
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize action='read' subject='ADMIN'>
                <PageAdminOverview />
              </RouteAuthorize>
            ),
          },
          {
            path: 'create',
            element: (
              <RouteAuthorize action='create' subject='ADMIN'>
                <PageAdminCreate />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RouteAuthorize action='update' subject='ADMIN'>
                <PageAdminEdit />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/show',
            element: (
              <RouteAuthorize action='read' subject='ADMIN'>
                <PageAdminShow />
              </RouteAuthorize>
            ),
          },
        ],
      },
      {
        path: '/permissions',
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize action='read' subject='ROLE'>
                <PagePermissionOverview />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/show',
            element: (
              <RouteAuthorize action='read' subject='ROLE'>
                <PagePermissionShow />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RouteAuthorize action='update' subject='ROLE'>
                <PagePermissionEdit />
              </RouteAuthorize>
            ),
          },
        ],
      },
      {
        path: '/roles',
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize action='read' subject='ROLE'>
                <PageRoleOverview />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/show',
            element: (
              <RouteAuthorize action='read' subject='ROLE'>
                <PageRoleShow />
              </RouteAuthorize>
            ),
          },
          {
            path: 'create',
            element: (
              <RouteAuthorize action='create' subject='ROLE'>
                <PageRoleCreate />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RouteAuthorize action='update' subject='ROLE'>
                <PageRoleEdit />
              </RouteAuthorize>
            ),
          },
        ],
      },
      {
        path: '/settings',
        element: <Settings />,
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize isAnyPermission>
                <SettingsProfile />
              </RouteAuthorize>
            ),
          },
          {
            path: 'account',
            element: (
              <RouteAuthorize isAnyPermission>
                <SettingsAccount />
              </RouteAuthorize>
            ),
          },
          {
            path: 'password',
            element: (
              <RouteAuthorize isAnyPermission>
                <SettingsPassword />
              </RouteAuthorize>
            ),
          },
          {
            path: 'security',
            element: (
              <RouteAuthorize isAnyPermission>
                <SettingsSecurity />
              </RouteAuthorize>
            ),
          },
          {
            path: 'appearance',
            element: (
              <RouteAuthorize isAnyPermission>
                <SettingsAppearance />
              </RouteAuthorize>
            ),
          },
          {
            path: 'display',
            element: (
              <RouteAuthorize isAnyPermission>
                <SettingsDisplay />
              </RouteAuthorize>
            ),
          },
        ],
      },
      {
        path: '/website-settings',
        element: (
          <RouteAuthorize isAnyPermission>
            <SettingsWebsite />
          </RouteAuthorize>
        ),
      },
      {
        path: '/cms-pages',
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize action='read' subject='PAGE'>
                <PageCmsPageOverview />
              </RouteAuthorize>
            ),
          },
          {
            path: 'create',
            element: (
              <RouteAuthorize action='create' subject='PAGE'>
                <PageCmsPageCreate />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RouteAuthorize action='update' subject='PAGE'>
                <PageCmsPageEdit />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/show',
            element: (
              <RouteAuthorize action='read' subject='PAGE'>
                <PageCmsPageShow />
              </RouteAuthorize>
            ),
          },
        ],
      },
      {
        path: '/white-labels',
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize action='read' subject='WHITE_LABEL'>
                <PageWhiteLabelOverview />
              </RouteAuthorize>
            ),
          },
          {
            path: 'create',
            element: (
              <RouteAuthorize action='create' subject='WHITE_LABEL'>
                <PageWhiteLabelCreate />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RouteAuthorize action='update' subject='WHITE_LABEL'>
                <PageWhiteLabelEdit />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/show',
            element: (
              <RouteAuthorize action='read' subject='WHITE_LABEL'>
                <PageWhiteLabelShow />
              </RouteAuthorize>
            ),
          },
        ],
      },
      {
        path: '/files',
        element: (
          <RouteAuthorize action='read' subject='FILE'>
            <PageFileOverview />
          </RouteAuthorize>
        ),
      },
      {
        path: '/locations',
        element: (
          <RouteAuthorize action='read' subject='LOCATION'>
            <PageLocationOverview />
          </RouteAuthorize>
        ),
      },
      {
        path: '/users',
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize action='read' subject='USER'>
                <PageUserOverview />
              </RouteAuthorize>
            ),
          },
          {
            path: 'create',
            element: (
              <RouteAuthorize action='create' subject='USER'>
                <PageUserCreate />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <RouteAuthorize action='update' subject='USER'>
                <PageUserEdit />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/show',
            element: (
              <RouteAuthorize action='read' subject='USER'>
                <PageUserShow />
              </RouteAuthorize>
            ),
          },
        ],
      },
      {
        path: 'logs',
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize action='read' subject='LOG'>
                <PageActivityLogOverview />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/show',
            element: (
              <RouteAuthorize action='read' subject='LOG'>
                <PageActivityLogShow />
              </RouteAuthorize>
            ),
          },
        ],
      },

      {
        path: 'email-logs',
        children: [
          {
            index: true,
            element: (
              <RouteAuthorize action='read' subject='EMAIL_LOG'>
                <PageEmailLogOverview />
              </RouteAuthorize>
            ),
          },
          {
            path: ':id/show',
            element: (
              <RouteAuthorize action='read' subject='EMAIL_LOG'>
                <PageEmailLogShow />
              </RouteAuthorize>
            ),
          },
        ],
      },
      {
        path: 'api-endpoints',
        element: (
          <RouteAuthorize requireSuperAdmin>
            <PageApiEndpoints />
          </RouteAuthorize>
        ),
      },

      {
        path: '/errors',
        children: [
          {
            path: 'not-found',
            element: <NotFoundError />,
          },
          {
            path: 'internal-server-error',
            element: <GeneralError />,
          },
          {
            path: 'unauthorized',
            element: <UnauthorizedError />,
          },
          {
            path: 'forbidden',
            element: <ForbiddenError />,
          },
          {
            path: 'maintenance-error',
            element: <MaintenanceError />,
          },
        ],
      },
      {
        path: 'help-center',
        element: <PageHelpCenter />,
      },
      ...(import.meta.env.DEV
        ? [
            {
              path: 'dev',
              lazy: async () => ({
                Component: (await import('@/pages/dev')).PageDevPlayground,
              }),
            },
            {
              path: 'dev/form-examples',
              element: <Navigate to='/dev?tab=forms' replace />,
            },
            {
              path: 'dev/ui-preview',
              element: <Navigate to='/dev?tab=table' replace />,
            },
          ]
        : []),
      {
        path: '*',
        element: <NotFoundError />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundError />,
  },
]

const routes: RouteObject[] = [
  {
    element: <SetupGuard />,
    children: [
      {
        path: '/setup',
        element: (
          <Suspense fallback={<Loader />}>
            <PageSystemSetup />
          </Suspense>
        ),
      },
      ...appRoutes,
    ],
  },
]

const router = createBrowserRouter(routes)

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
