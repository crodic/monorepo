import { cn } from '@/lib/utils'
import {
  MediaPlayer,
  MediaPlayerControls,
  MediaPlayerControlsOverlay,
  MediaPlayerError,
  MediaPlayerFullscreen,
  MediaPlayerLoading,
  MediaPlayerPiP,
  MediaPlayerPlay,
  MediaPlayerPlaybackSpeed,
  MediaPlayerSeek,
  MediaPlayerSeekBackward,
  MediaPlayerSeekForward,
  MediaPlayerTime,
  MediaPlayerVideo,
  MediaPlayerVolume,
  MediaPlayerVolumeIndicator,
} from '@/components/ui/media-player'

export function VideoMediaPlayer({
  src,
  className,
}: {
  src: string
  className?: string
}) {
  return (
    <MediaPlayer
      key={src}
      className={cn(
        'relative flex size-full max-h-[min(650px,72dvh)] max-w-full items-center justify-center overflow-hidden rounded-xl bg-black text-white shadow-2xl',
        className
      )}
    >
      <MediaPlayerVideo
        src={src}
        className='size-full max-h-full max-w-full object-contain'
        playsInline
        preload='metadata'
      />
      <MediaPlayerLoading />
      <MediaPlayerError />
      <MediaPlayerVolumeIndicator />
      <MediaPlayerControls className='flex-col items-start gap-2.5'>
        <MediaPlayerControlsOverlay />
        <MediaPlayerSeek />
        <div className='flex w-full items-center justify-between gap-2'>
          <div className='flex items-center gap-1 sm:gap-2'>
            <MediaPlayerPlay />
            <MediaPlayerSeekBackward />
            <MediaPlayerSeekForward />
            <MediaPlayerVolume />
            <MediaPlayerTime />
          </div>
          <div className='flex items-center gap-1 sm:gap-2'>
            <MediaPlayerPlaybackSpeed />
            <MediaPlayerPiP />
            <MediaPlayerFullscreen />
          </div>
        </div>
      </MediaPlayerControls>
    </MediaPlayer>
  )
}
