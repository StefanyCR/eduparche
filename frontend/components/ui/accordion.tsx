'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/* ─── AccordionItem ─── */
type AccordionItemProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function AccordionItem({ title, children, defaultOpen = false, className }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('border-b border-border last:border-0', className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3.5',
          'text-sm font-medium text-foreground text-left',
          'hover:bg-surface-high/60 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        )}
      >
        <span>{title}</span>
        <svg
          aria-hidden
          className={cn(
            'w-4 h-4 text-muted shrink-0 ml-3 transition-transform duration-200',
            open && 'rotate-180',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/*
        Se usa una grid con animación en grid-template-rows para hacer el efecto de expandir/colapsar.
      */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0.5 text-sm text-secondary leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Accordion (contenedor) ─── */
type AccordionProps = {
  children: React.ReactNode
  className?: string
}

export function Accordion({ children, className }: AccordionProps) {
  return (
    /*
      overflow-hidden redondea las esquinas del primer y último item
      sin que los bordes del item sobresalgan del contenedor.
    */
    <div
      className={cn(
        'rounded-xl border border-border bg-surface overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}
