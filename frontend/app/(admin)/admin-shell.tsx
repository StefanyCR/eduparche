'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineStar,
  HiOutlineHome,
  HiOutlineLogout,
  HiMenu,
  HiX,
} from 'react-icons/hi'
import api from '@/lib/api'
import { UserProvider } from '@/lib/user-context'
import type { AuthUser } from '@/lib/types'
import { cn } from '@/lib/utils'

const adminNav = [
  { href: '/admin/usuarios',     label: 'Usuarios',       icon: HiOutlineUserGroup },
  { href: '/admin/cursos',       label: 'Cursos',         icon: HiOutlineBookOpen  },
  { href: '/admin/gamificacion', label: 'Gamificación',   icon: HiOutlineStar      },
]

export default function AdminShell({
  user,
  children,
}: {
  user: AuthUser
  children: React.ReactNode
}) {
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const profile     = user.profile
  const displayName = profile?.displayName
    ?? `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
  const initials    = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase()

  function handleLogout() {
    api.post('/auth/logout').finally(() => router.push('/login'))
  }

  return (
    <UserProvider user={user}>
      <div className="min-h-screen bg-background flex">

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── Sidebar ─────────────────────────────────────────────── */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-surface border-r border-border transition-transform duration-200',
          'md:relative md:w-56 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}>

          <button
            className="absolute right-3 top-3 rounded-lg p-1 text-secondary hover:bg-surface-high md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <HiX className="w-5 h-5" />
          </button>

          {/* Logo + badge admin */}
          <div className="px-5 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">EP</span>
              </div>
              <div>
                <span className="text-base font-semibold text-foreground">
                  Edu<span className="text-primary">Parche</span>
                </span>
                <span className="ml-1.5 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">ADMIN</span>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="px-3 pb-3">
            <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-surface-high">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-semibold shrink-0">
                {initials || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{displayName || '—'}</p>
                <p className="text-[11px] text-secondary truncate">Administrador</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 space-y-0.5">
            {adminNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
                    active
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-secondary hover:bg-surface-high hover:text-foreground',
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-accent' : 'text-muted')} />
                  {label}
                </Link>
              )
            })}

            <div className="pt-2 border-t border-border mt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-secondary hover:bg-surface-high hover:text-foreground transition-colors"
              >
                <HiOutlineHome className="w-4 h-4 shrink-0 text-muted" />
                Volver al inicio
              </Link>
            </div>
          </nav>

          {/* Logout */}
          <div className="px-3 pb-4 border-t border-border pt-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-secondary hover:bg-surface-high hover:text-danger transition-colors"
            >
              <HiOutlineLogout className="w-4 h-4 shrink-0" />
              Cerrar sesión
            </button>
          </div>

        </aside>

        {/* ─── Main ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto">

          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur border-b border-border md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1 text-secondary hover:bg-surface-high"
              aria-label="Abrir menú"
            >
              <HiMenu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              Edu<span className="text-primary">Parche</span>
              <span className="ml-1.5 text-[10px] font-semibold text-accent">ADMIN</span>
            </span>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>

        </main>

      </div>
    </UserProvider>
  )
}
