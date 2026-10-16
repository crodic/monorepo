'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MobileToolbarGroupProps {
  label: string
  children: React.ReactNode
  className?: string
}

export const MobileToolbarGroup = ({
  label,
  children,
  className,
}: MobileToolbarGroupProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const closeDrawer = () => setIsOpen(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={cn('h-8 w-max gap-1 px-3 font-normal', className)}
        >
          {label}
          <ChevronDown className='h-4 w-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-56 p-2' align='start'>
        <div className='text-muted-foreground px-2 py-1 text-xs font-semibold'>
          {label}
        </div>
        <div className='flex flex-col gap-1 p-1'>
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { closeDrawer } as {
                  closeDrawer: () => void
                })
              : child
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const MobileToolbarItem = ({
  children,
  active,
  onClick,
  closeDrawer,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  closeDrawer?: () => void
}) => (
  <button
    className={cn(
      'hover:bg-accent flex w-full items-center rounded-md px-4 py-2 text-sm transition-colors',
      active && 'bg-accent'
    )}
    onClick={(e) => {
      onClick?.(e)
      setTimeout(() => {
        closeDrawer?.()
      }, 100)
    }}
    {...props}
  >
    {children}
  </button>
)
