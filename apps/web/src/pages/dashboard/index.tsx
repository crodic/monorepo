import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CpuIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  HardDriveIcon,
  LayersIcon,
  RefreshCwIcon,
  ServerIcon,
  WorkflowIcon,
  XCircleIcon,
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'

type HealthIndicator = {
  status?: string
  [key: string]: unknown
}

type HealthCheckResponse = {
  status: 'ok' | 'error' | 'shutting_down' | string
  info?: Record<string, HealthIndicator>
  error?: Record<string, HealthIndicator>
  details?: Record<string, HealthIndicator>
}

const HEALTH_QUERY_KEY = ['system_health'] as const
const QUEUE_STATS_QUERY_KEY = ['queue_stats'] as const

type QueueStats = {
  name: string
  counts: {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    paused: number
  }
}

type QueueStatsResponse = {
  bullBoardUrl: string
  queues: QueueStats[]
  updatedAt: string
}

async function apiGetSystemHealth(): Promise<HealthCheckResponse> {
  const apiUrl = new URL(import.meta.env.VITE_API_URL, window.location.origin)
  const healthUrl = `${apiUrl.origin}/health`
  const response = await axios.get<HealthCheckResponse>(healthUrl, {
    timeout: 10000,
    withCredentials: true,
  })

  return response.data
}

async function apiGetQueueStats(): Promise<QueueStatsResponse> {
  const apiUrl = new URL(import.meta.env.VITE_API_URL, window.location.origin)
  const queuesUrl = `${apiUrl.origin}/health/queues`
  const response = await axios.get<QueueStatsResponse>(queuesUrl, {
    timeout: 10000,
    withCredentials: true,
  })

  return response.data
}

export function Dashboard() {
  const { t } = useTranslation()
  const healthQuery = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: apiGetSystemHealth,
    refetchInterval: 30_000,
  })
  const queueQuery = useQuery({
    queryKey: QUEUE_STATS_QUERY_KEY,
    queryFn: apiGetQueueStats,
    refetchInterval: 15_000,
  })

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')}</title>
        <meta name='description' content={t('dashboard.title')} />
      </Helmet>

      {/* ===== Top Heading ===== */}

      {/* ===== Main ===== */}
      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {t('dashboard.title')}
          </h1>
          <p className='text-muted-foreground'>
            {t('dashboard.systemHealth.description')}
          </p>
        </div>

        <SystemHealthSection
          health={healthQuery.data}
          isLoading={healthQuery.isFetching}
          isError={healthQuery.isError}
          updatedAt={healthQuery.dataUpdatedAt}
          onRefresh={() => healthQuery.refetch()}
        />

        <QueueMonitoringSection
          data={queueQuery.data}
          isLoading={queueQuery.isFetching}
          onRefresh={() => queueQuery.refetch()}
        />
      </Main>
    </>
  )
}

function SystemHealthSection({
  health,
  isLoading,
  isError,
  updatedAt,
  onRefresh,
}: {
  health?: HealthCheckResponse
  isLoading: boolean
  isError: boolean
  updatedAt: number
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const overall = getHealthOverall(health, isError)
  const indicators = getHealthIndicators(health)

  return (
    <Card>
      <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1.5'>
          <CardTitle className='flex items-center gap-2'>
            <ServerIcon className='text-primary size-5' />
            {t('dashboard.systemHealth.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.systemHealth.description')}
          </CardDescription>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={overall.variant} className={overall.className}>
            <overall.icon className='size-3.5' />
            {overall.label}
          </Badge>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCwIcon
              className={isLoading ? 'size-4 animate-spin' : 'size-4'}
            />
            {t('dashboard.systemHealth.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-3 md:grid-cols-3'>
          <HealthSummaryItem
            label={t('dashboard.systemHealth.overallStatus')}
            value={overall.label}
            tone={overall.tone}
          />
          <HealthSummaryItem
            label={t('dashboard.systemHealth.indicators')}
            value={String(indicators.length)}
            tone='neutral'
          />
          <HealthSummaryItem
            label={t('dashboard.systemHealth.lastChecked')}
            value={
              updatedAt
                ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
                : 'Not checked yet'
            }
            tone='neutral'
          />
        </div>

        {isError ? (
          <div className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border p-4 text-sm'>
            {t('dashboard.systemHealth.unreachable')}
          </div>
        ) : indicators.length === 0 ? (
          <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
            {isLoading
              ? 'Checking system health...'
              : 'No health details found.'}
          </div>
        ) : (
          <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
            {indicators.map((indicator) => (
              <HealthIndicatorCard key={indicator.name} indicator={indicator} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HealthSummaryItem({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'healthy' | 'warning' | 'critical' | 'neutral'
}) {
  return (
    <div className='rounded-md border p-3'>
      <p className='text-muted-foreground text-xs font-medium'>{label}</p>
      <p className={getHealthToneClass(tone)}>{value}</p>
    </div>
  )
}

function getIndicatorIcon(name: string, healthy: boolean) {
  const lower = name.toLowerCase()
  if (lower.includes('database')) return <DatabaseIcon className='size-4' />
  if (lower.includes('redis')) return <LayersIcon className='size-4' />
  if (lower.includes('memory')) return <CpuIcon className='size-4' />
  if (lower.includes('disk') || lower.includes('storage'))
    return <HardDriveIcon className='size-4' />
  if (lower.includes('queue')) return <WorkflowIcon className='size-4' />
  if (lower.includes('system')) return <ServerIcon className='size-4' />
  if (healthy) return <CheckCircle2Icon className='size-4' />
  return <XCircleIcon className='size-4' />
}

function HealthIndicatorCard({
  indicator,
}: {
  indicator: { name: string; status: string; detail: HealthIndicator }
}) {
  const healthy = indicator.status === 'up'

  return (
    <div className='flex items-start gap-3 rounded-md border p-3'>
      <div
        className={
          healthy
            ? 'flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600'
            : 'bg-destructive/10 text-destructive flex size-9 shrink-0 items-center justify-center rounded-md'
        }
      >
        {getIndicatorIcon(indicator.name, healthy)}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='font-medium capitalize'>
            {formatIndicatorName(indicator.name)}
          </p>
          <Badge variant={healthy ? 'secondary' : 'destructive'}>
            {indicator.status}
          </Badge>
        </div>
        <p className='text-muted-foreground mt-1 truncate text-xs'>
          {formatIndicatorDetail(indicator.detail)}
        </p>
      </div>
    </div>
  )
}

function QueueMonitoringSection({
  data,
  isLoading,
  onRefresh,
}: {
  data?: QueueStatsResponse
  isLoading: boolean
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const queues = data?.queues ?? []
  const hasFailedJobs = queues.some((q) => (q.counts?.failed ?? 0) > 0)

  return (
    <Card>
      <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1.5'>
          <CardTitle className='flex items-center gap-2'>
            <WorkflowIcon className='text-primary size-5' />
            {t('dashboard.queues.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.queues.description')}</CardDescription>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge
            variant={hasFailedJobs ? 'destructive' : 'secondary'}
            className={
              !hasFailedJobs
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : ''
            }
          >
            {hasFailedJobs
              ? t('dashboard.queues.hasFailed')
              : t('dashboard.queues.healthy')}
          </Badge>
          {data?.bullBoardUrl && (
            <Button asChild variant='default' size='sm'>
              <a
                href={data.bullBoardUrl}
                target='_blank'
                rel='noreferrer'
                className='gap-1.5'
              >
                <ExternalLinkIcon className='size-3.5' />
                {t('dashboard.queues.openBullBoard')}
              </a>
            </Button>
          )}
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCwIcon
              className={isLoading ? 'size-4 animate-spin' : 'size-4'}
            />
            {t('dashboard.systemHealth.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {queues.length === 0 ? (
          <div className='text-muted-foreground rounded-md border border-dashed p-4 text-sm'>
            {isLoading
              ? 'Loading queue metrics...'
              : t('dashboard.queues.noQueues')}
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2'>
            {queues.map((queue) => {
              const counts = queue.counts || {
                waiting: 0,
                active: 0,
                completed: 0,
                failed: 0,
              }
              const queueHasError = (counts.failed ?? 0) > 0

              return (
                <div
                  key={queue.name}
                  className='space-y-3 rounded-lg border p-4'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <LayersIcon className='text-muted-foreground size-4' />
                      <span className='font-semibold capitalize'>
                        {queue.name} Queue
                      </span>
                    </div>
                    <Badge
                      variant={queueHasError ? 'destructive' : 'outline'}
                      className='text-xs'
                    >
                      {counts.active > 0
                        ? `${counts.active} ${t('dashboard.queues.active')}`
                        : queueHasError
                          ? `${counts.failed} ${t('dashboard.queues.failed')}`
                          : 'Idle'}
                    </Badge>
                  </div>
                  <div className='grid grid-cols-4 gap-2 text-center text-xs'>
                    <div className='bg-muted/50 rounded p-2'>
                      <p className='text-muted-foreground font-medium'>
                        {t('dashboard.queues.waiting')}
                      </p>
                      <p className='mt-1 text-sm font-semibold'>
                        {formatNumber(counts.waiting)}
                      </p>
                    </div>
                    <div className='bg-muted/50 rounded p-2'>
                      <p className='text-muted-foreground font-medium'>
                        {t('dashboard.queues.active')}
                      </p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          counts.active > 0 ? 'text-primary font-bold' : ''
                        }`}
                      >
                        {formatNumber(counts.active)}
                      </p>
                    </div>
                    <div className='bg-muted/50 rounded p-2'>
                      <p className='text-muted-foreground font-medium'>
                        {t('dashboard.queues.completed')}
                      </p>
                      <p className='mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400'>
                        {formatNumber(counts.completed)}
                      </p>
                    </div>
                    <div className='bg-muted/50 rounded p-2'>
                      <p className='text-muted-foreground font-medium'>
                        {t('dashboard.queues.failed')}
                      </p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          queueHasError ? 'text-destructive font-bold' : ''
                        }`}
                      >
                        {formatNumber(counts.failed)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getHealthOverall(
  health: HealthCheckResponse | undefined,
  isError: boolean
) {
  if (isError) {
    return {
      label: 'Unreachable',
      tone: 'critical' as const,
      variant: 'destructive' as const,
      className: '',
      icon: XCircleIcon,
    }
  }

  if (!health) {
    return {
      label: 'Checking',
      tone: 'neutral' as const,
      variant: 'outline' as const,
      className: '',
      icon: RefreshCwIcon,
    }
  }

  if (health.status === 'ok') {
    return {
      label: 'Operational',
      tone: 'healthy' as const,
      variant: 'secondary' as const,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      icon: CheckCircle2Icon,
    }
  }

  if (health.status === 'shutting_down') {
    return {
      label: 'Shutting down',
      tone: 'warning' as const,
      variant: 'outline' as const,
      className: 'border-amber-500/40 text-amber-700 dark:text-amber-400',
      icon: AlertTriangleIcon,
    }
  }

  return {
    label: 'Degraded',
    tone: 'critical' as const,
    variant: 'destructive' as const,
    className: '',
    icon: XCircleIcon,
  }
}

function getHealthIndicators(health?: HealthCheckResponse) {
  const details = health?.details ?? {}

  return Object.entries(details).map(([name, detail]) => ({
    name,
    status: detail.status ?? 'unknown',
    detail,
  }))
}

function getHealthToneClass(
  tone: 'healthy' | 'warning' | 'critical' | 'neutral'
) {
  const base = 'mt-1 text-lg font-semibold'

  if (tone === 'healthy') return `${base} text-emerald-600`
  if (tone === 'warning') return `${base} text-amber-600`
  if (tone === 'critical') return `${base} text-destructive`

  return base
}

function formatIndicatorName(name: string) {
  return name.replace(/-/g, ' ')
}

function formatIndicatorDetail(detail: HealthIndicator) {
  const entries = Object.entries(detail).filter(([key]) => key !== 'status')

  if (entries.length === 0) {
    return 'No additional details'
  }

  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' · ')
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat().format(value ?? 0)
}
