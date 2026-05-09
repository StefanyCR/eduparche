'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HiOutlineBookOpen,
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineStar,
  HiOutlineBriefcase,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineCog,
  HiMenu,
  HiX,
} from 'react-icons/hi'
import api from '@/lib/api'
import { UserProvider } from '@/lib/user-context'
import type { AuthUser } from '@/lib/types'
import { cn } from '@/lib/utils'

type NavLink = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

const navByRole: Record<AuthUser['role'], NavLink[]> = {
  STUDENT: [
    { href: '/dashboard',       label: 'Mis cursos',      icon: HiOutlineBookOpen  },
    { href: '/catalogo',        label: 'Catálogo',        icon: HiOutlineViewGrid  },
    { href: '/tutorias',        label: 'Tutorías',        icon: HiOutlineUserGroup },
    { href: '/logros',          label: 'Logros',          icon: HiOutlineStar      },
    { href: '/empleo',          label: 'Empleo',          icon: HiOutlineBriefcase },
    { href: '/perfil',          label: 'Perfil',          icon: HiOutlineUser      },
  ],
  TUTOR: [
    { href: '/dashboard',        label: 'Mis cursos',      icon: HiOutlineBookOpen  },
    { href: '/mis-estudiantes',  label: 'Mis estudiantes', icon: HiOutlineUserGroup },
    { href: '/catalogo',         label: 'Catálogo',        icon: HiOutlineViewGrid  },
    { href: '/logros',           label: 'Logros',          icon: HiOutlineStar      },
    { href: '/perfil',           label: 'Perfil',          icon: HiOutlineUser      },
  ],
  ADMIN: [
    { href: '/dashboard',        label: 'Mis cursos',      icon: HiOutlineBookOpen  },
    { href: '/catalogo',         label: 'Catálogo',        icon: HiOutlineViewGrid  },
    { href: '/perfil',           label: 'Perfil',          icon: HiOutlineUser      },
  ],
}

const roleLabel: Record<AuthUser['role'], string> = {
  STUDENT: 'Estudiante',
  TUTOR:   'Tutor',
  ADMIN:   'Administrador',
}

export default function DashboardShell({
  user,
  children,
}: {
  user: AuthUser
  children: React.ReactNode
}) {
  const router        = useRouter()
  const pathname      = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const profile     = user.profile
  const displayName = profile?.displayName
    ?? `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
  const initials    = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase()

  function handleLogout() {
    api.post('/auth/logout').finally(() => {
      router.push('/login')
    })
  }

  return (
    <UserProvider user={user}>
      <div className="min-h-screen bg-background flex">

        {/* Overlay oscuro en móvil */}
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

          {/* Logo */}
          <div className="px-5 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">EP</span>
              </div>
              <span className="text-base font-semibold text-foreground">
                Edu<span className="text-primary">Parche</span>
              </span>
            </div>
          </div>

          {/* Avatar */}
          <div className="px-3 pb-3">
            <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-surface-high">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                {initials || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{displayName || '—'}</p>
                <p className="text-[11px] text-secondary truncate">{roleLabel[user.role]}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 space-y-0.5">
            {navByRole[user.role].map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-secondary hover:bg-surface-high hover:text-foreground',
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : 'text-muted')} />
                  {label}
                </Link>
              )
            })}

            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors mt-2 border border-dashed border-border',
                  pathname.startsWith('/admin')
                    ? 'bg-accent/10 text-accent font-semibold border-accent/30'
                    : 'text-secondary hover:bg-surface-high hover:text-foreground',
                )}
              >
                <HiOutlineCog className={cn('w-4 h-4 shrink-0', pathname.startsWith('/admin') ? 'text-accent' : 'text-muted')} />
                Panel admin
              </Link>
            )}
          </nav>

          {/* XP */}
          <div className="px-3 pb-3">
            <div className="px-3 py-2.5 rounded-xl bg-success-bg border border-primary/15">
              <p className="text-xs text-secondary">Puntos XP</p>
              <p className="text-lg font-bold text-primary">{user.totalPoints}</p>
            </div>
          </div>

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

          {/* Barra móvil */}
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
