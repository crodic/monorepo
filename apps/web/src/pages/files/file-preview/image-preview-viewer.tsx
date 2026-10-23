import { useRef, useState, type MouseEvent } from 'react'
import { Grid, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function ImagePreviewViewer({
  src,
  alt,
  className,
}: {
  src: string
  alt?: string
  className?: string
}) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isCheckerboard, setIsCheckerboard] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragStartRef = useRef({ x: 0, y: 0 })

  const handleZoomIn = () =>
    setScale((s) => Math.min(Number((s + 0.25).toFixed(2)), 4))
  const handleZoomOut = () =>
    setScale((s) => Math.max(Number((s - 0.25).toFixed(2)), 0.25))
  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div
      className={cn(
        'relative flex size-full max-h-[min(650px,72dvh)] min-h-[360px] items-center justify-center overflow-hidden rounded-xl select-none',
        isCheckerboard
          ? 'bg-neutral-900 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]'
          : 'bg-black/50',
        scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleReset}
    >
      <div
        className='flex items-center justify-center transition-transform duration-150 ease-out'
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
        }}
      >
        <img
          src={src}
          alt={alt}
          className='pointer-events-none max-h-[min(580px,65dvh)] max-w-full rounded-md object-contain shadow-2xl'
          draggable={false}
          decoding='async'
        />
      </div>

      {/* Floating Toolbar */}
      <div className='absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-black/80 px-3 py-1.5 shadow-2xl backdrop-blur-md'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 rounded-full text-white/80 hover:bg-white/20 hover:text-white'
          onClick={handleZoomOut}
          disabled={scale <= 0.25}
          title='Zoom out'
          aria-label='Zoom out'
        >
          <ZoomOut className='size-3.5' />
        </Button>
        <button
          type='button'
          onClick={handleReset}
          className='min-w-12 px-1.5 text-center text-xs font-semibold text-white/90 tabular-nums transition-colors hover:text-white'
          title='Reset zoom'
          aria-label='Reset zoom'
        >
          {Math.round(scale * 100)}%
        </button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 rounded-full text-white/80 hover:bg-white/20 hover:text-white'
          onClick={handleZoomIn}
          disabled={scale >= 4}
          title='Zoom in'
          aria-label='Zoom in'
        >
          <ZoomIn className='size-3.5' />
        </Button>
        <div className='mx-1 h-4 w-px bg-white/20' />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 rounded-full text-white/80 hover:bg-white/20 hover:text-white'
          onClick={handleRotate}
          title='Rotate 90°'
          aria-label='Rotate 90°'
        >
          <RotateCw className='size-3.5' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn(
            'size-7 rounded-full text-white/80 hover:bg-white/20 hover:text-white',
            isCheckerboard && 'bg-white/25 text-white'
          )}
          onClick={() => setIsCheckerboard((c) => !c)}
          title='Toggle transparency pattern'
          aria-label='Toggle transparency pattern'
        >
          <Grid className='size-3.5' />
        </Button>
      </div>
    </div>
  )
}
