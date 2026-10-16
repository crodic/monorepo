import { useCallback, useEffect, useRef, useState } from 'react'
import http from '@/lib/http'

interface UseImageUploadProps {
  onUpload?: (url: string) => void
}

export function useImageUpload({ onUpload }: UseImageUploadProps = {}) {
  const previewRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File, localUrl: string): Promise<string> => {
    try {
      setUploading(true)
      setError(null)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'cms')
      formData.append('disk', 'public')
      const res = await http.post<{ url: string }>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data?.url || localUrl
    } catch {
      // Fallback to local preview URL
      return localUrl
    } finally {
      setUploading(false)
    }
  }

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setFileName(file.name)
        const localUrl = URL.createObjectURL(file)
        setPreviewUrl(localUrl)
        previewRef.current = localUrl

        try {
          const uploadedUrl = await uploadFile(file, localUrl)
          onUpload?.(uploadedUrl)
        } catch (err) {
          URL.revokeObjectURL(localUrl)
          setPreviewUrl(null)
          setFileName(null)
          return
        }
      }
    },
    [onUpload]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setFileName(null)
    previewRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setError(null)
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
    uploading,
    error,
  }
}
