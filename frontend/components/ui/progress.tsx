import { cn } from '@/lib/utils'

type ProgressProps = {
  value: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md'
  variant?: 'primary' | 'accent' | 'highlight'
  className?: string
}

const tracks = {
  sm: 'h-1.5',
  md: 'h-2.5',
}

const fills = {
  primary:   'bg-gradient-to-r from-primary-soft to-primary',
  accent:    'bg-gradient-to-r from-accent-soft to-accent',
  highlight: 'bg-highlight',
}

export function Progress({
  value,
  label,
  showValue = false,
  size = 'md',
  variant = 'primary',
  className,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-foreground">{clamped}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn('w-full bg-surface-high rounded-full overflow-hidden', tracks[size])}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', fills[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
