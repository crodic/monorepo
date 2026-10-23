import { useCallback } from 'react'
import { Building2, Compass, Flag, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-shell'
import { CitiesTab } from './tabs/cities-tab'
import { CountriesTab } from './tabs/countries-tab'
import { RegionsTab } from './tabs/regions-tab'
import { StatesTab } from './tabs/states-tab'

export function PageLocationOverview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'countries'

  const handleTabChange = useCallback(
    (nextTab: string) => {
      // When switching tabs, reset all query params (filter, sort, search, page) in the URL and keep only the new tab
      navigate(`?tab=${nextTab}`, { replace: true })
    },
    [navigate]
  )

  return (
    <>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title={t('locations.overview.title', 'Location Management')}
          description={t(
            'locations.overview.description',
            'Manage global regions, countries, states/provinces, and cities.'
          )}
        />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='w-full space-y-4'
        >
          <TabsList className='grid w-full grid-cols-2 sm:inline-flex sm:w-auto'>
            <TabsTrigger value='countries' className='gap-2'>
              <Flag className='size-4' />
              <span>{t('locations.tabs.countries', 'Countries')}</span>
            </TabsTrigger>
            <TabsTrigger value='states' className='gap-2'>
              <Building2 className='size-4' />
              <span>{t('locations.tabs.states', 'States / Provinces')}</span>
            </TabsTrigger>
            <TabsTrigger value='cities' className='gap-2'>
              <Globe className='size-4' />
              <span>{t('locations.tabs.cities', 'Cities / Districts')}</span>
            </TabsTrigger>
            <TabsTrigger value='regions' className='gap-2'>
              <Compass className='size-4' />
              <span>{t('locations.tabs.regions', 'Regions')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='countries' className='mt-2'>
            {activeTab === 'countries' && <CountriesTab />}
          </TabsContent>

          <TabsContent value='states' className='mt-2'>
            {activeTab === 'states' && <StatesTab />}
          </TabsContent>

          <TabsContent value='cities' className='mt-2'>
            {activeTab === 'cities' && <CitiesTab />}
          </TabsContent>

          <TabsContent value='regions' className='mt-2'>
            {activeTab === 'regions' && <RegionsTab />}
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
