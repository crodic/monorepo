import { useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, Paintbrush, Save, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  defaultThemeStyles,
  type ThemeMode,
  type ThemeStyles,
} from '@/lib/theme-builder/default-theme'
import {
  downloadThemeJson,
  generateThemeCss,
  parseThemeCss,
} from '@/lib/theme-builder/theme-utils'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  type WhiteLabelFormSchema,
  type WhiteLabelSchema,
  whiteLabelFormSchema,
} from '../schema'
import { TabBrandAssets } from './tab-brand-assets'
import { TabColorsFonts } from './tab-colors-fonts'
import { TabSeoMeta } from './tab-seo-meta'
import { WhiteLabelCodeDialog } from './white-label-code-dialog'
import { WhiteLabelPasteCssDialog } from './white-label-paste-css-dialog'
import { WhiteLabelPreview } from './white-label-preview'

type WhiteLabelFormProps = {
  initialData?: WhiteLabelSchema | null
  isSubmitting?: boolean
  onSubmit: (data: WhiteLabelFormSchema) => void
  onCancel?: () => void
}

type TabType = 'brand' | 'colors' | 'seo' | 'preview'

export function WhiteLabelForm({
  initialData,
  isSubmitting,
  onSubmit,
  onCancel,
}: WhiteLabelFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('brand')
  const [editorMode, setEditorMode] = useState<ThemeMode>('light')
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false)
  const [isPasteCssDialogOpen, setIsPasteCssDialogOpen] = useState(false)

  const cssInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<WhiteLabelFormSchema>({
    resolver: zodResolver(whiteLabelFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      target: initialData?.target ?? 'admin',
      isActive: initialData?.isActive ?? false,
      brandName: initialData?.brandName ?? '',
      siteTitle: initialData?.siteTitle ?? '',
      siteTagline: initialData?.siteTagline ?? '',
      copyrightText: initialData?.copyrightText ?? '',
      metaTitle: initialData?.metaTitle ?? '',
      metaDescription: initialData?.metaDescription ?? '',
      canonicalUrl: initialData?.canonicalUrl ?? '',
      styles: initialData?.styles ?? defaultThemeStyles,
      site_logo: undefined,
      site_dark_logo: undefined,
      site_favicon: undefined,
      og_image: undefined,
      twitter_image: undefined,
      remove_site_logo: false,
      remove_site_dark_logo: false,
      remove_site_favicon: false,
      remove_og_image: false,
      remove_twitter_image: false,
    },
  })

  const watchedBrandName = useWatch({
    control: form.control,
    name: 'brandName',
  })
  const watchedSiteTitle = useWatch({
    control: form.control,
    name: 'siteTitle',
  })
  const watchedSiteTagline = useWatch({
    control: form.control,
    name: 'siteTagline',
  })
  const watchedStyles = useWatch({ control: form.control, name: 'styles' })
  const watchedName = useWatch({ control: form.control, name: 'name' })
  const watchedSiteLogo = useWatch({ control: form.control, name: 'site_logo' })
  const watchedSiteDarkLogo = useWatch({
    control: form.control,
    name: 'site_dark_logo',
  })
  const watchedSiteFavicon = useWatch({
    control: form.control,
    name: 'site_favicon',
  })
  const watchedRemoveSiteLogo = useWatch({
    control: form.control,
    name: 'remove_site_logo',
  })
  const watchedRemoveSiteDarkLogo = useWatch({
    control: form.control,
    name: 'remove_site_dark_logo',
  })
  const watchedRemoveSiteFavicon = useWatch({
    control: form.control,
    name: 'remove_site_favicon',
  })

  const currentStyles = watchedStyles || defaultThemeStyles
  const cssText = useMemo(
    () => generateThemeCss(currentStyles),
    [currentStyles]
  )

  const previewLogoUrl = useMemo(() => {
    if (watchedRemoveSiteLogo) return null
    if (watchedSiteLogo instanceof File)
      return URL.createObjectURL(watchedSiteLogo)
    return initialData?.siteLogo || null
  }, [watchedSiteLogo, watchedRemoveSiteLogo, initialData?.siteLogo])

  const previewDarkLogoUrl = useMemo(() => {
    if (watchedRemoveSiteDarkLogo) return null
    if (watchedSiteDarkLogo instanceof File)
      return URL.createObjectURL(watchedSiteDarkLogo)
    return initialData?.siteDarkLogo || null
  }, [
    watchedSiteDarkLogo,
    watchedRemoveSiteDarkLogo,
    initialData?.siteDarkLogo,
  ])

  const previewFaviconUrl = useMemo(() => {
    if (watchedRemoveSiteFavicon) return null
    if (watchedSiteFavicon instanceof File)
      return URL.createObjectURL(watchedSiteFavicon)
    return initialData?.siteFavicon || null
  }, [watchedSiteFavicon, watchedRemoveSiteFavicon, initialData?.siteFavicon])

  const updateStyles = (newStyles: ThemeStyles) => {
    form.setValue('styles', newStyles, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const copyCss = async () => {
    await navigator.clipboard.writeText(cssText)
    toast.success('Theme CSS copied to clipboard')
  }

  const importCssFile = async (file?: File) => {
    if (!file) return
    try {
      const content = await file.text()
      updateStyles(parseThemeCss(content, currentStyles))
      toast.success('CSS variables imported successfully')
    } catch {
      toast.error('Failed to parse CSS file')
    } finally {
      if (cssInputRef.current) cssInputRef.current.value = ''
    }
  }

  const importJsonFile = async (file?: File) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      updateStyles(data.styles ?? data)
      toast.success('Theme JSON imported successfully')
    } catch {
      toast.error('Invalid theme JSON file')
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = ''
    }
  }

  const applyPastedCss = (
    pastedText: string,
    pasteScope: 'auto' | 'current' | 'light' | 'dark'
  ) => {
    try {
      const scopeParam =
        pasteScope === 'auto'
          ? undefined
          : pasteScope === 'current'
            ? editorMode
            : pasteScope
      const parsed = parseThemeCss(pastedText, currentStyles, scopeParam)
      updateStyles(parsed)
      toast.success('CSS variables injected into theme successfully!')
      setIsPasteCssDialogOpen(false)
    } catch {
      toast.error('Failed to parse CSS syntax')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Hidden file pickers for direct CSS & JSON import */}
        <input
          ref={cssInputRef}
          type='file'
          accept='.css,text/css'
          className='hidden'
          onChange={(e) => importCssFile(e.target.files?.[0])}
        />
        <input
          ref={jsonInputRef}
          type='file'
          accept='.json,application/json'
          className='hidden'
          onChange={(e) => importJsonFile(e.target.files?.[0])}
        />

        {/* Top Control Bar: Tabs + Action buttons */}
        <div className='flex flex-wrap items-center justify-between gap-3 border-b pb-4'>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabType)}
            className='w-full sm:w-auto'
          >
            <TabsList className='grid w-full grid-cols-2 sm:flex sm:w-auto'>
              <TabsTrigger value='brand' className='gap-1.5'>
                <Sparkles className='size-4' />
                <span>Brand & Assets</span>
              </TabsTrigger>
              <TabsTrigger value='colors' className='gap-1.5'>
                <Paintbrush className='size-4' />
                <span>Colors & Fonts</span>
              </TabsTrigger>
              <TabsTrigger value='seo' className='gap-1.5'>
                <Search className='size-4' />
                <span>SEO & Meta</span>
              </TabsTrigger>
              <TabsTrigger value='preview' className='gap-1.5'>
                <Eye className='text-primary size-4' />
                <span>Live Preview</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='flex items-center gap-2'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 text-xs'
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}

            <Button
              type='submit'
              size='sm'
              disabled={isSubmitting}
              className='h-8 gap-1.5 text-xs'
            >
              <Save className='size-3.5' />
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>

        {/* Tab 1: Brand & Assets */}
        {activeTab === 'brand' && (
          <TabBrandAssets form={form} initialData={initialData} />
        )}

        {/* Tab 2: OKLCH Colors & Fonts */}
        {activeTab === 'colors' && (
          <TabColorsFonts
            currentStyles={currentStyles}
            editorMode={editorMode}
            setEditorMode={setEditorMode}
            onUpdateStyles={updateStyles}
            onOpenPasteDialog={() => setIsPasteCssDialogOpen(true)}
            onOpenCodeDialog={() => setIsCodeDialogOpen(true)}
            onCopyCss={copyCss}
            onExportJson={() =>
              downloadThemeJson(
                { name: watchedName || 'theme', styles: currentStyles },
                `${watchedName || 'theme'}.json`
                  .toLowerCase()
                  .replace(/\s+/g, '-')
              )
            }
            onViewLivePreview={() => setActiveTab('preview')}
            cssInputRef={cssInputRef}
            jsonInputRef={jsonInputRef}
          />
        )}

        {/* Tab 3: SEO & Meta */}
        {activeTab === 'seo' && (
          <TabSeoMeta form={form} initialData={initialData} />
        )}

        {/* Tab 4: Live Portal Preview */}
        {activeTab === 'preview' && (
          <div className='space-y-4'>
            <div className='bg-card flex items-center justify-between rounded-lg border p-3 shadow-xs'>
              <div>
                <p className='text-sm font-semibold'>Portal Live Simulation</p>
                <p className='text-muted-foreground text-xs'>
                  Real-time preview of brand identity, colors, typography, and
                  UI components.
                </p>
              </div>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='h-8 text-xs'
                onClick={() => setActiveTab('colors')}
              >
                <Paintbrush className='me-1.5 size-3.5' />
                Back to Color Editor
              </Button>
            </div>

            <WhiteLabelPreview
              styles={currentStyles}
              brandName={watchedBrandName}
              siteTitle={watchedSiteTitle}
              siteTagline={watchedSiteTagline}
              siteLogoUrl={previewLogoUrl}
              siteDarkLogoUrl={previewDarkLogoUrl}
              siteFaviconUrl={previewFaviconUrl}
            />
          </div>
        )}

        {/* Modal: Paste / Import CSS Variables */}
        <WhiteLabelPasteCssDialog
          open={isPasteCssDialogOpen}
          onOpenChange={setIsPasteCssDialogOpen}
          editorMode={editorMode}
          onApply={applyPastedCss}
        />

        {/* Modal: Code View */}
        <WhiteLabelCodeDialog
          open={isCodeDialogOpen}
          onOpenChange={setIsCodeDialogOpen}
          cssText={cssText}
          onCopyCss={copyCss}
        />
      </form>
    </Form>
  )
}
