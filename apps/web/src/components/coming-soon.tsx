import { Telescope } from 'lucide-react'

export function ComingSoon() {
  return (
    <div className='min-h-dvh'>
      <div className='m-auto flex size-full flex-col items-center justify-center gap-2'>
        <Telescope size={72} aria-hidden='true' />
        <h1 className='text-4xl leading-tight font-bold text-balance'>
          Coming Soon!
        </h1>
        <p className='text-muted-foreground text-center text-pretty'>
          This page has not been created yet. <br />
          Stay tuned though!
        </p>
      </div>
    </div>
  )
}
