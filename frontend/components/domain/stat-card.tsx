import { cn } from '@/lib/utils'

type Trend = { value: number; label?: string }

type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: Trend
  className?: string
}

export function StatCard({ icon, label, value, trend, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full',
              isPositive
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger',
            )}
          >
            <svg
              className={cn('w-3 h-3', !isPositive && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            {Math.abs(trend.value)}
            {trend.label && <span className="ml-0.5 text-secondary font-normal">{trend.label}</span>}
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
        <p className="text-sm text-secondary mt-0.5">{label}</p>
      </div>
    </div>
  )
}
