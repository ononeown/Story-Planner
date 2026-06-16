import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink',
          'placeholder:text-ink-faint transition-colors',
          'focus:border-accent/70 focus:ring-2 focus:ring-accent/30 focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  },
)
