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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { WhiteLabelFormSchema, WhiteLabelSchema } from '../schema'
import { WhiteLabelAssetField } from './white-label-asset-field'

type TabSeoMetaProps = {
  form: UseFormReturn<WhiteLabelFormSchema>
  initialData?: WhiteLabelSchema | null
}

export function TabSeoMeta({ form, initialData }: TabSeoMetaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base font-semibold'>
          Search Engine Optimization (SEO)
        </CardTitle>
        <CardDescription>
          Custom meta tags for browser title, search engine snippets, and social
          cards.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='metaTitle'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., Visel Art - Modern Admin'
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
            name='canonicalUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canonical URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., https://admin.viselart.com'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='metaDescription'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder='Search engine summary snippet...'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid gap-4 pt-2 sm:grid-cols-2'>
          <WhiteLabelAssetField
            form={form}
            name='og_image'
            removeName='remove_og_image'
            label='OpenGraph Image'
            description='Social media share card preview'
            previewUrl={initialData?.ogImage}
          />
          <WhiteLabelAssetField
            form={form}
            name='twitter_image'
            removeName='remove_twitter_image'
            label='Twitter Card Image'
            description='Twitter/X summary card preview'
            previewUrl={initialData?.twitterImage}
          />
        </div>
      </CardContent>
    </Card>
  )
}
