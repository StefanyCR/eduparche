'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

type DialogProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: DialogSize
  children: React.ReactNode
  className?: string
}

const sizes: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}


export function Dialog({ open, onClose, title, description, size = 'md', children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else {
      if (el.open) el.close()
    }
  }, [open])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handleClose = () => onClose()
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      className={cn(
        'w-full bg-surface rounded-2xl border border-border shadow-xl',
        'p-0 m-auto',
        /* backdrop nativo */
        'backdrop:bg-foreground/20 backdrop:backdrop-blur-sm',
        /* reset de estilos del navegador */
        'open:flex open:flex-col',
        sizes[size],
        className,
      )}
    >
      {title && (
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-secondary mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="px-5 py-4 flex-1 overflow-y-auto">
        {children}
      </div>
    </dialog>
  )
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 px-5 py-4 border-t border-border shrink-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
