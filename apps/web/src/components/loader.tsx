import { Loader2 } from 'lucide-react'

export default function Loader() {
  return (
    <div className='flex min-h-dvh items-center justify-center'>
      <Loader2 className='animate-spin' size={32} />
    </div>
  )
}
