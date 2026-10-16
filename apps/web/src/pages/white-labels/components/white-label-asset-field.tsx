import { useEffect, useMemo } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { ImageIcon, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { WhiteLabelFormSchema } from '../schema'

type AssetFieldName =
  'site_logo' | 'site_dark_logo' | 'site_favicon' | 'og_image' | 'twitter_image'

type RemoveAssetFieldName =
  | 'remove_site_logo'
  | 'remove_site_dark_logo'
  | 'remove_site_favicon'
  | 'remove_og_image'
  | 'remove_twitter_image'

type WhiteLabelAssetFieldProps = {
  form: UseFormReturn<WhiteLabelFormSchema>
  name: AssetFieldName
  removeName: RemoveAssetFieldName
  label: string
  description: string
  previewUrl?: string | null
}

export function WhiteLabelAssetField({
  form,
  name,
  removeName,
  label,
  description,
  previewUrl,
}: WhiteLabelAssetFieldProps) {
  const selectedFile = useWatch({ control: form.control, name })
  const isRemoved = useWatch({ control: form.control, name: removeName })

  const localPreviewUrl = useMemo(() => {
    if (!(selectedFile instanceof File)) return null
    return URL.createObjectURL(selectedFile)
  }, [selectedFile])

  const resolvedPreviewUrl = isRemoved
    ? null
    : localPreviewUrl || previewUrl || null

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: { onChange, value: _value, ...field } }) => (
        <FormItem className='flex flex-col justify-between'>
          <div>
            <div className='flex items-center justify-between gap-2'>
              <FormLabel className='text-xs font-medium'>{label}</FormLabel>
              {(resolvedPreviewUrl || isRemoved) && (
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  className='h-6 px-1.5 text-xs'
                  onClick={() => {
                    form.setValue(name, undefined, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    form.setValue(removeName, !isRemoved, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                >
                  {isRemoved ? (
                    <>
                      <RotateCcw className='me-1 size-3' />
                      Undo
                    </>
                  ) : (
                    <>
                      <Trash2 className='me-1 size-3' />
                      Remove
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className='bg-muted/30 my-2 flex aspect-video items-center justify-center rounded-md border p-2'>
              {resolvedPreviewUrl ? (
                <img
                  src={resolvedPreviewUrl}
                  alt={label}
                  className='max-h-full max-w-full object-contain'
                />
              ) : (
                <div className='text-muted-foreground flex flex-col items-center gap-1 text-xs'>
                  <ImageIcon className='size-5' />
                  <span>No file</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <FormControl>
              <Input
                {...field}
                type='file'
                accept='image/png,image/webp,image/jpeg,image/svg+xml,image/x-icon'
                className='h-8 text-xs'
                onChange={(event) => {
                  form.setValue(removeName, false, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  onChange(event.target.files?.[0])
                }}
              />
            </FormControl>
            <FormDescription className='line-clamp-1 text-[11px]'>
              {description}
            </FormDescription>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}
