import { cn } from '@/lib/utils'

type Variant = 'solid' | 'outline' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: Variant
  size?: Size
} & React.ComponentProps<'button'>

const variants: Record<Variant, string> = {
  solid:
    'bg-primary text-primary-fg hover:bg-primary-hover border border-transparent shadow-sm',
  outline:
    'bg-transparent text-primary border border-primary hover:bg-surface',
  ghost:
    'bg-transparent text-secondary hover:bg-surface border border-transparent',
  danger:
    'bg-danger text-white hover:bg-danger/90 border border-transparent shadow-sm',
}

const sizes: Record<Size, string> = {
  sm: 'h-8  px-3   text-sm   rounded-lg  gap-1.5',
  md: 'h-10 px-4   text-sm   rounded-xl  gap-2',
  lg: 'h-12 px-5   text-base rounded-xl  gap-2',
}

export function Button({
  variant = 'solid',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'cursor-pointer select-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
