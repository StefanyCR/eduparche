import { cn } from '@/lib/utils'

type Position = 'top' | 'bottom' | 'left' | 'right'

type TooltipProps = {
  content: string
  position?: Position
  children: React.ReactNode
  className?: string
}

const positions: Record<Position, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full   left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2  -translate-y-1/2  mr-2',
  right:  'left-full  top-1/2  -translate-y-1/2  ml-2',
}

export function Tooltip({ content, position = 'top', children, className }: TooltipProps) {
  return (
    <div className={cn('relative inline-flex group', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'absolute z-50 px-2.5 py-1.5 text-xs font-medium rounded-lg',
          'bg-foreground text-background shadow-sm',
          'whitespace-nowrap pointer-events-none',
          'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100',
          'transition-all duration-150 ease-out',
          positions[position],
        )}
      >
        {content}
      </span>
    </div>
  )
}
