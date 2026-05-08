import { cn } from '@/lib/utils'

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function buildPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)
  return pages
}

const btnBase = [
  'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium',
  'transition-all duration-150 select-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ')

const btnIdle   = 'text-secondary hover:text-foreground hover:bg-surface-high'
const btnActive = 'bg-primary text-primary-fg shadow-sm'

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPages(page, totalPages)

  return (
    <nav aria-label="Paginación" className={cn('flex items-center gap-1', className)}>
      {/* Anterior */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className={cn(btnBase, btnIdle)}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            aria-hidden
            className="w-9 h-9 flex items-center justify-center text-muted text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            aria-label={`Ir a página ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(btnBase, p === page ? btnActive : btnIdle)}
          >
            {p}
          </button>
        ),
      )}

      {/* Siguiente */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
        className={cn(btnBase, btnIdle)}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  )
}
