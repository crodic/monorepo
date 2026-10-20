import { Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  MediaPlayer,
  MediaPlayerAudio,
  MediaPlayerError,
  MediaPlayerLoading,
  MediaPlayerPlay,
  MediaPlayerPlaybackSpeed,
  MediaPlayerSeek,
  MediaPlayerSeekBackward,
  MediaPlayerSeekForward,
  MediaPlayerTime,
  MediaPlayerVolume,
  MediaPlayerVolumeIndicator,
} from '@/components/ui/media-player'

export function AudioMediaPlayer({
  src,
  title,
  className,
}: {
  src: string
  title?: string
  className?: string
}) {
  return (
    <MediaPlayer
      key={src}
      className={cn(
        'border-border/60 from-card/80 to-background/90 relative flex w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-b p-8 shadow-2xl backdrop-blur-md',
        className
      )}
    >
      <MediaPlayerAudio src={src} preload='metadata' />
      <div className='bg-primary/10 text-primary ring-primary/20 mb-6 flex size-28 items-center justify-center rounded-3xl shadow-inner ring-1'>
        <Music className='size-14 animate-pulse' />
      </div>
      {title && (
        <h4 className='text-foreground mb-4 max-w-md truncate text-center text-base font-semibold'>
          {title}
        </h4>
      )}
      <MediaPlayerLoading />
      <MediaPlayerError />
      <MediaPlayerVolumeIndicator />
      <div className='flex w-full flex-col gap-3'>
        <MediaPlayerSeek />
        <div className='flex w-full items-center justify-between gap-2 pt-1'>
          <div className='flex items-center gap-1 sm:gap-2'>
            <MediaPlayerPlay />
            <MediaPlayerSeekBackward />
            <MediaPlayerSeekForward />
            <MediaPlayerVolume />
            <MediaPlayerTime />
          </div>
          <div className='flex items-center gap-1'>
            <MediaPlayerPlaybackSpeed />
          </div>
        </div>
      </div>
    </MediaPlayer>
  )
}
