import { cn } from '@/lib/utils'

type CardProps = {
  padding?: 'none' | 'sm' | 'md' | 'lg'
} & React.ComponentProps<'div'>

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-2xl shadow-sm',
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      className={cn('text-base font-semibold text-foreground', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export function CardDescription({ className, children, ...props }: React.ComponentProps<'p'>) {
  return (
    <p className={cn('text-sm text-secondary mt-0.5', className)} {...props}>
      {children}
    </p>
  )
}

export function CardFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mt-5 pt-4 border-t border-border flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}
