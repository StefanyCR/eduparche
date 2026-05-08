import { cn } from '@/lib/utils'

type SeparatorProps = {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  className?: string
}

export function Separator({ orientation = 'horizontal', label, className }: SeparatorProps) {
  if (orientation === 'vertical') {
    return (
      <div
        aria-hidden
        className={cn('w-px bg-border self-stretch shrink-0', className)}
      />
    )
  }

  if (label) {
    return (
      <div aria-hidden className={cn('flex items-center gap-3', className)}>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    )
  }

  return (
    <hr
      aria-hidden
      className={cn('border-none h-px bg-border w-full', className)}
    />
  )
}
