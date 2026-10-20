import type { FileSchema } from '../schema'
import { AudioMediaPlayer } from './audio-media-player'
import { DocumentPreviewViewer } from './document-preview-viewer'
import { ImagePreviewViewer } from './image-preview-viewer'
import {
  isPreviewableAudio,
  isPreviewableImage,
  isPreviewableVideo,
} from './preview-utils'
import { VideoMediaPlayer } from './video-media-player'

export function FilePreviewDetail({
  file,
  url,
  className,
}: {
  file: FileSchema
  url?: string
  className?: string
}) {
  const previewUrl = url ?? file.url

  if (isPreviewableVideo(file)) {
    return <VideoMediaPlayer src={previewUrl} className={className} />
  }

  if (isPreviewableAudio(file)) {
    return (
      <AudioMediaPlayer
        src={previewUrl}
        title={file.original_name}
        className={className}
      />
    )
  }

  if (isPreviewableImage(file)) {
    return (
      <ImagePreviewViewer
        src={previewUrl}
        alt={file.original_name}
        className={className}
      />
    )
  }

  return (
    <DocumentPreviewViewer file={file} url={previewUrl} className={className} />
  )
}
