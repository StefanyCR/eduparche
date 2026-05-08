import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'accent' | 'info' | 'highlight' | 'success' | 'warning' | 'danger'

type BadgeProps = {
  variant?: BadgeVariant
} & React.ComponentProps<'span'>

const variants: Record<BadgeVariant, string> = {
  default:   'bg-surface-high  text-secondary border-border',
  primary:   'bg-primary/10   text-primary   border-primary/20',
  accent:    'bg-accent/10    text-accent    border-accent/20',
  info:      'bg-info-bg      text-info      border-info/20',
  highlight: 'bg-warning-bg   text-warning   border-warning/20',
  success:   'bg-success-bg   text-success   border-success/20',
  warning:   'bg-warning-bg   text-warning   border-warning/20',
  danger:    'bg-danger-bg    text-danger    border-danger/20',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5',
        'text-xs font-medium rounded-full border',
        'whitespace-nowrap',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
