'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

/* ─── Tipos ─── */
type ToastVariant = 'info' | 'success' | 'warning' | 'danger'

type ToastItem = {
  id: string
  variant: ToastVariant
  title?: string
  message: string
  duration: number
}

type ToastCtx = {
  toast: (opts: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => void
  dismiss: (id: string) => void
}

/* ─── Contexto ─── */
const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [leaving, setLeaving] = useState<Set<string>>(new Set())

  const dismiss = useCallback((id: string) => {
    setLeaving(prev => new Set(prev).add(id))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      setLeaving(prev => { const s = new Set(prev); s.delete(id); return s })
    }, 200) // coincide con la duración de animate-toast-out
  }, [])

  const toast = useCallback((opts: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => {
    const id = Math.random().toString(36).slice(2, 9)
    const duration = opts.duration ?? 4000
    setToasts(prev => [...prev, { ...opts, id, duration }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <Ctx.Provider value={{ toast, dismiss }}>
      {children}
      <Toaster toasts={toasts} leaving={leaving} onDismiss={dismiss} />
    </Ctx.Provider>
  )
}

/* ─── Hook ─── */
export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Envuelve tu layout con <ToastProvider>')
  return ctx
}

/* ─── Estilos por variante — solo tokens ─── */
const toastStyles: Record<ToastVariant, string> = {
  info:    'border-info/30    text-info',
  success: 'border-success/30 text-success',
  warning: 'border-warning/30 text-warning',
  danger:  'border-danger/30  text-danger',
}

const toastIcons: Record<ToastVariant, React.ReactNode> = {
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

/* ─── Toaster — se monta dentro del Provider ─── */
function Toaster({
  toasts,
  leaving,
  onDismiss,
}: {
  toasts: ToastItem[]
  leaving: Set<string>
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-label="Notificaciones"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)]',
            'rounded-xl border bg-surface shadow-lg px-4 py-3',
            'pointer-events-auto',
            leaving.has(t.id) ? 'animate-toast-out' : 'animate-toast-in',
            toastStyles[t.variant],
          )}
        >
          {toastIcons[t.variant]}

          <div className="flex-1 min-w-0">
            {t.title && (
              <p className="text-sm font-semibold text-foreground leading-snug">{t.title}</p>
            )}
            <p className="text-sm text-secondary leading-relaxed">{t.message}</p>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Cerrar notificación"
            className="text-muted hover:text-foreground transition-colors shrink-0 mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
