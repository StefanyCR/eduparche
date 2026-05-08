import { cn } from '@/lib/utils'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

type AlertProps = {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}

const styles: Record<AlertVariant, { wrap: string; icon: string; title: string }> = {
  info:    { wrap: 'bg-info-bg    border-info/25',     icon: 'text-info',     title: 'text-info' },
  success: { wrap: 'bg-success-bg border-success/25',  icon: 'text-success',  title: 'text-success' },
  warning: { wrap: 'bg-warning-bg border-warning/25',  icon: 'text-warning',  title: 'text-warning' },
  danger:  { wrap: 'bg-danger-bg  border-danger/25',   icon: 'text-danger',   title: 'text-danger' },
}

const icons: Record<AlertVariant, React.ReactNode> = {
  info: (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  danger: (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const s = styles[variant]

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3',
        s.wrap,
        className,
      )}
    >
      <span className={s.icon}>{icons[variant]}</span>
      <div className="min-w-0 flex-1">
        {title && (
          <p className={cn('text-sm font-semibold mb-0.5', s.title)}>{title}</p>
        )}
        <p className="text-sm text-secondary leading-relaxed">{children}</p>
      </div>
    </div>
  )
}
