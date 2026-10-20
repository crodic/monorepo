import { useRef, useState } from 'react'
import { FileIcon, Music, Video as VideoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FileSchema } from '../schema'
import {
  getImageThumbnailUrl,
  isPreviewableAudio,
  isPreviewableImage,
  isPreviewableVideo,
} from './preview-utils'

export function VideoThumbnail({
  file,
  className,
  hoverToPlay = true,
}: {
  file: FileSchema
  className?: string
  hoverToPlay?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleMouseEnter = () => {
    if (!hoverToPlay) return
    hoverTimeoutRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay could be prevented by browser policy
          })
      }
    }, 150)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0.5
      setIsPlaying(false)
    }
  }

  return (
    <div
      className={cn(
        'group/video relative size-full overflow-hidden',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={`${file.url}#t=0.5`}
        className='size-full object-cover'
        muted
        loop
        playsInline
        preload='metadata'
      />
      <span
        className={cn(
          'absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm transition-all',
          isPlaying
            ? 'bg-primary text-primary-foreground animate-pulse'
            : 'bg-background/85 text-foreground backdrop-blur-xs'
        )}
      >
        <VideoIcon className='size-3' />
        {isPlaying && (
          <span className='text-[10px] font-semibold'>Playing</span>
        )}
      </span>
    </div>
  )
}

export function FilePreviewThumbnail({
  file,
  className,
  transformations = 'w_360,h_225,c_fill,q_75',
  useOriginal = false,
  hoverToPlay = true,
}: {
  file: FileSchema
  className?: string
  transformations?: string
  useOriginal?: boolean
  hoverToPlay?: boolean
}) {
  if (isPreviewableVideo(file)) {
    return (
      <VideoThumbnail
        file={file}
        className={className}
        hoverToPlay={hoverToPlay}
      />
    )
  }

  if (isPreviewableImage(file)) {
    const imageUrl = useOriginal
      ? file.url
      : getImageThumbnailUrl(file, transformations)

    return (
      <img
        src={imageUrl}
        alt={file.original_name}
        className={cn('size-full object-cover', className)}
        loading='lazy'
        decoding='async'
        onError={(e) => {
          if (e.currentTarget.src !== file.url) {
            e.currentTarget.src = file.url
          }
        }}
      />
    )
  }

  if (isPreviewableAudio(file)) {
    return (
      <div
        className={cn(
          'bg-muted/50 text-muted-foreground relative flex size-full items-center justify-center',
          className
        )}
      >
        <Music className='text-primary/80 size-6' />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'text-muted-foreground flex size-full items-center justify-center',
        className
      )}
    >
      <FileIcon className='size-5' />
    </div>
  )
}
