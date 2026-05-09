'use client'

// Este componente recibe la lista de usuarios del Server Component (page.tsx)
// y se encarga de toda la interactividad: abrir/cerrar el drawer al seleccionar un usuario

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import UserDrawer from './user-drawer'
import type { AuthUser, UserStatus } from '@/lib/types'

type AdminUser = AuthUser & {
  minorRequest: { letter: string | null; status: string; createdAt: string } | null
}

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'Activo', PENDING_APPROVAL: 'Pendiente', INACTIVE: 'Inactivo', REJECTED: 'Rechazado',
}
const STATUS_VARIANT: Record<UserStatus, 'success' | 'warning' | 'default' | 'danger'> = {
  ACTIVE: 'success', PENDING_APPROVAL: 'warning', INACTIVE: 'default', REJECTED: 'danger',
}

export default function UsuariosClient({ users }: { users: AdminUser[] }) {
  // El usuario seleccionado determina si el drawer está abierto o cerrado
  const [selected, setSelected] = useState<AdminUser | null>(null)

  // Separamos los pendientes para mostrarlos primero con un aviso visual
  const pending = users.filter((u) => u.status === 'PENDING_APPROVAL')
  const rest    = users.filter((u) => u.status !== 'PENDING_APPROVAL')

  return (
    <>
      <div className="space-y-8">
        {/* ── Encabezado ── */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-sm text-secondary mt-1">
            {users.length} usuarios registrados · {pending.length} pendientes de aprobación
          </p>
        </div>

        {/* ── Sección de pendientes (solo aparece si hay alguno) ── */}
        {pending.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning inline-block" />
              Pendientes de aprobación ({pending.length})
            </h2>
            <div className="space-y-2">
              {pending.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  highlight
                  onClick={() => setSelected(user)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Lista general de usuarios ── */}
        <section>
          <h2 className="text-sm font-semibold text-secondary mb-3">Todos los usuarios</h2>
          {rest.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">Sin otros usuarios</p>
          ) : (
            <div className="space-y-2">
              {rest.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onClick={() => setSelected(user)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* El drawer se monta siempre pero solo se muestra cuando hay un usuario seleccionado */}
      <UserDrawer
        user={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}

// ── Fila individual de usuario en la lista ────────────────────────────────

function UserRow({
  user,
  highlight,
  onClick,
}: {
  user: AdminUser
  highlight?: boolean
  onClick: () => void
}) {
  const name = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : '—'

  return (
    // Al hacer clic en cualquier parte de la fila se abre el drawer
    <button
      onClick={onClick}
      className={`w-full text-left flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
        highlight
          ? 'bg-warning-bg border-warning/20 hover:border-warning/40'
          : 'bg-surface border-border hover:border-primary/30 hover:bg-surface-high'
      }`}
    >
      {/* Avatar con inicial */}
      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
        {user.profile?.firstName?.[0]?.toUpperCase() ?? '?'}
      </div>

      {/* Nombre y email */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <Badge variant={STATUS_VARIANT[user.status]}>{STATUS_LABEL[user.status]}</Badge>
          <span className="text-xs text-muted capitalize">{user.role.toLowerCase()}</span>
        </div>
        <p className="text-xs text-secondary truncate mt-0.5">{user.email}</p>
      </div>

      {/* Fecha de registro (visible solo en pantallas medianas+) */}
      <span className="text-xs text-muted shrink-0 hidden md:block">
        {new Date(user.createdAt).toLocaleDateString('es-CO', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </span>

      {/* Indicador visual de que es clickeable */}
      <svg className="w-4 h-4 text-muted shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
