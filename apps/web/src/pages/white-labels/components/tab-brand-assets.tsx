import type { UseFormReturn } from 'react-hook-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { WhiteLabelFormSchema, WhiteLabelSchema } from '../schema'
import { WhiteLabelAssetField } from './white-label-asset-field'

type TabBrandAssetsProps = {
  form: UseFormReturn<WhiteLabelFormSchema>
  initialData?: WhiteLabelSchema | null
}

export function TabBrandAssets({ form, initialData }: TabBrandAssetsProps) {
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>
            Profile Configuration
          </CardTitle>
          <CardDescription>
            Profile name, target application scope, and activation status.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., Default Blue, Acme Corp'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='target'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Scope</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className='flex items-center gap-4 pt-1.5'
                    >
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='admin' id='target-admin' />
                        <label
                          htmlFor='target-admin'
                          className='cursor-pointer text-sm leading-none font-medium'
                        >
                          Admin Portal
                        </label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='client' id='target-client' />
                        <label
                          htmlFor='target-client'
                          className='cursor-pointer text-sm leading-none font-medium'
                        >
                          Client App
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder='Brief description of this white label profile'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='isActive'
            render={({ field }) => (
              <FormItem className='flex items-center justify-between rounded-lg border p-3 shadow-xs'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-sm font-medium'>
                    Set as Active Profile
                  </FormLabel>
                  <FormDescription className='text-xs'>
                    When active, this profile immediately drives the branding
                    and theme across the selected target.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>
            Brand Identity & Copy
          </CardTitle>
          <CardDescription>
            Brand names and slogans displayed in headers, footers, and auth
            screens.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='brandName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., Visel Art'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='siteTitle'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., Visel Art Admin Portal'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='siteTagline'
            render={({ field }) => (
              <FormItem className='sm:col-span-2'>
                <FormLabel>Tagline / Slogan</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., Creative Art & Modern Management Platform'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='copyrightText'
            render={({ field }) => (
              <FormItem className='sm:col-span-2'>
                <FormLabel>Copyright Text</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., © 2026 Visel Art. All rights reserved.'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>
            Media & Logo Assets
          </CardTitle>
          <CardDescription>
            Upload custom logos and icons (PNG, WebP, SVG, ICO max 5MB).
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <WhiteLabelAssetField
            form={form}
            name='site_logo'
            removeName='remove_site_logo'
            label='Light Mode Logo'
            description='Used in sidebar and light themes'
            previewUrl={initialData?.siteLogo}
          />
          <WhiteLabelAssetField
            form={form}
            name='site_dark_logo'
            removeName='remove_site_dark_logo'
            label='Dark Mode Logo'
            description='Used in dark mode themes'
            previewUrl={initialData?.siteDarkLogo}
          />
          <WhiteLabelAssetField
            form={form}
            name='site_favicon'
            removeName='remove_site_favicon'
            label='Favicon Icon'
            description='Browser tab icon (PNG or ICO)'
            previewUrl={initialData?.siteFavicon}
          />
        </CardContent>
      </Card>
    </div>
  )
}
