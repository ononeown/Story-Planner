import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm leading-relaxed text-ink',
        'placeholder:text-ink-faint transition-colors resize-none',
        'focus:border-accent/70 focus:ring-2 focus:ring-accent/30 focus:outline-none',
        className,
      )}
      {...props}
    />
  )
})
