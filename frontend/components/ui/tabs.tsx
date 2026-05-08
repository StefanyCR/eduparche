'use client'

import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

/* ─── Contexto interno ─── */
type TabsCtx = { value: string; onChange: (v: string) => void }
const Ctx = createContext<TabsCtx | null>(null)

function useTabsCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Usa TabsTrigger/TabsContent dentro de <Tabs>')
  return ctx
}

/* ─── Tabs (raíz) ─── */
type TabsProps = {
  defaultValue: string
  value?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, value: controlled, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const value = controlled ?? internal

  function onChange(v: string) {
    setInternal(v)
    onValueChange?.(v)
  }

  return (
    <Ctx.Provider value={{ value, onChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </Ctx.Provider>
  )
}

/* ─── TabsList — contenedor de triggers ─── */
export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 bg-surface-high border border-border rounded-xl p-1',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ─── TabsTrigger — botón de pestaña ─── */
type TabsTriggerProps = {
  value: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function TabsTrigger({ value, children, disabled, className }: TabsTriggerProps) {
  const { value: active, onChange } = useTabsCtx()
  const isActive = active === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onChange(value)}
      className={cn(
        'px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive
          ? 'bg-background text-foreground shadow-sm border border-border'
          : 'text-secondary hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ─── TabsContent — contenido de cada pestaña ─── */
type TabsContentProps = {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: active } = useTabsCtx()
  if (active !== value) return null

  return (
    <div role="tabpanel" className={cn('mt-4 outline-none', className)} tabIndex={0}>
      {children}
    </div>
  )
}
