import { cn } from '@/lib/utils'

/* Wrapper con scroll horizontal en móvil */
export function Table({ className, children, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table
        className={cn('w-full text-sm border-collapse', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className, children, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('bg-surface-high border-b border-border', className)}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TableBody({ className, children, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      className={cn('divide-y divide-border', className)}
      {...props}
    >
      {children}
    </tbody>
  )
}

export function TableRow({ className, children, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'hover:bg-surface-high/50 transition-colors',
        '[&:last-child>td]:border-0',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ className, children, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wide whitespace-nowrap',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn('px-4 py-3 text-sm text-foreground', className)}
      {...props}
    >
      {children}
    </td>
  )
}

export function TableCaption({ className, children, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      className={cn('py-3 text-xs text-muted text-center', className)}
      {...props}
    >
      {children}
    </caption>
  )
}
