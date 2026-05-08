import { cn } from '@/lib/utils'

type XpBadgeSize = 'sm' | 'md' | 'lg'

type XpBadgeProps = {
  xp: number
  size?: XpBadgeSize
  className?: string
}

const sizes: Record<XpBadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-1.5 gap-2',
}

const iconSizes: Record<XpBadgeSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function XpBadge({ xp, size = 'md', className }: XpBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        'bg-gradient-to-r from-primary to-accent text-white',
        'shadow-sm',
        sizes[size],
        className,
      )}
    >
      {/* Bolt icon */}
      <svg
        className={cn(iconSizes[size], 'shrink-0')}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13 2L4.09 12.96A1 1 0 005 14h6v8l8.91-10.96A1 1 0 0019 10h-6V2z" />
      </svg>
      {xp.toLocaleString()} XP
    </span>
  )
}
