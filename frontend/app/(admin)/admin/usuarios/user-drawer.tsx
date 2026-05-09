'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import type { AuthUser, UserStatus } from '@/lib/types'

// Tipo extendido del usuario para el panel admin.
// Incluye la solicitud del menor si aplica.
type AdminUser = AuthUser & {
  minorRequest: { letter: string | null; status: string; createdAt: string } | null
}

// ─── Datos para los botones de cambio de estado ───────────────────────────

type StatusAction = { label: string; nextStatus: UserStatus; color: string }

// Cada estado tiene acciones diferentes que el admin puede tomar
const STATUS_ACTIONS: Partial<Record<UserStatus, StatusAction[]>> = {
  PENDING_APPROVAL: [
    { label: 'Aprobar cuenta',  nextStatus: 'ACTIVE',   color: 'text-success border-success/30 hover:bg-success-bg'  },
    { label: 'Rechazar',        nextStatus: 'REJECTED',  color: 'text-danger  border-danger/30  hover:bg-danger-bg'   },
  ],
  ACTIVE:   [{ label: 'Desactivar cuenta', nextStatus: 'INACTIVE', color: 'text-danger border-danger/30 hover:bg-danger-bg' }],
  INACTIVE: [{ label: 'Reactivar cuenta',  nextStatus: 'ACTIVE',   color: 'text-success border-success/30 hover:bg-success-bg' }],
  REJECTED: [{ label: 'Reactivar cuenta',  nextStatus: 'ACTIVE',   color: 'text-success border-success/30 hover:bg-success-bg' }],
}

// ─── Etiquetas visuales de estado y rol ───────────────────────────────────

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'Activo', PENDING_APPROVAL: 'Pendiente', INACTIVE: 'Inactivo', REJECTED: 'Rechazado',
}
const STATUS_VARIANT: Record<UserStatus, 'success' | 'warning' | 'default' | 'danger'> = {
  ACTIVE: 'success', PENDING_APPROVAL: 'warning', INACTIVE: 'default', REJECTED: 'danger',
}
const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Estudiante', TUTOR: 'Tutor', ADMIN: 'Administrador', SUPER_ADMIN: 'Super Admin',
}

// ─── Componente principal del drawer ──────────────────────────────────────

export default function UserDrawer({
  user,
  onClose,
}: {
  user: AdminUser | null   // null = drawer cerrado
  onClose: () => void
}) {
  const router  = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // El drawer no renderiza nada si no hay usuario seleccionado
  if (!user) return null

  const profile     = user.profile
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : user.email
  const initials    = profile ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : '?'

  // Llama al backend para cambiar el estado y luego refresca la lista
  async function handleStatusChange(nextStatus: UserStatus) {
    setBusy(true)
    setError('')
    try {
      await api.patch(`/users/${user!.id}/status`, { status: nextStatus })
      router.refresh() // vuelve a correr el Server Component que trae los datos del backend
      onClose()
    } catch {
      setError('No se pudo actualizar el estado. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  // Llama al backend para cambiar el rol
  async function handleRoleChange(role: string) {
    setBusy(true)
    setError('')
    try {
      await api.patch(`/users/${user!.id}/role`, { role })
      router.refresh()
      onClose()
    } catch {
      setError('No se pudo actualizar el rol. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const statusActions = STATUS_ACTIONS[user.status] ?? []

  return (
    <>
      {/* Fondo oscuro semitransparente que cierra el drawer al hacer clic */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel lateral que desliza desde la derecha */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col overflow-y-auto">

        {/* ── Encabezado ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Detalle del usuario</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:bg-surface-high transition-colors"
            aria-label="Cerrar panel"
          >
            {/* Ícono X */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">

          {/* ── Información básica del usuario ── */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{displayName}</p>
              <p className="text-sm text-secondary">{user.email}</p>
              <p className="text-xs text-muted mt-0.5">
                Registrado el {new Date(user.createdAt).toLocaleDateString('es-CO', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Badges de estado y rol actuales */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={STATUS_VARIANT[user.status]}>{STATUS_LABEL[user.status]}</Badge>
            <Badge variant="primary">{ROLE_LABEL[user.role] ?? user.role}</Badge>
          </div>

          {/* ── Carta del menor (solo aparece si el usuario la envió) ── */}
          {user.minorRequest?.letter && (
            <div className="rounded-xl bg-warning-bg border border-warning/20 p-4">
              <p className="text-xs font-semibold text-warning mb-2">📄 Carta de autorización del menor</p>
              <p className="text-sm text-secondary leading-relaxed italic">
                "{user.minorRequest.letter}"
              </p>
            </div>
          )}

          {/* ── Mensaje de error si algo falla ── */}
          {error && (
            <div className="rounded-xl bg-danger-bg border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* ── Sección: cambiar estado de la cuenta ── */}
          {statusActions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-3">
                Estado de la cuenta
              </p>
              <div className="flex flex-wrap gap-2">
                {statusActions.map((action) => (
                  <button
                    key={action.nextStatus}
                    disabled={busy}
                    onClick={() => handleStatusChange(action.nextStatus)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors disabled:opacity-50 ${action.color}`}
                  >
                    {busy ? 'Guardando...' : action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Separador ── */}
          <div className="h-px bg-border" />

          {/* ── Sección: cambiar el rol del usuario ── */}
          <div>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-3">
              Rol en la plataforma
            </p>
            {/* Mostramos un botón por cada rol disponible. El rol actual aparece resaltado. */}
            <div className="grid grid-cols-3 gap-2">
              {(['STUDENT', 'TUTOR', 'ADMIN'] as const).map((role) => (
                <button
                  key={role}
                  disabled={busy || user.role === role}
                  onClick={() => handleRoleChange(role)}
                  className={`py-2 px-3 text-sm rounded-xl border transition-colors disabled:cursor-default ${
                    user.role === role
                      ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                      : 'text-secondary border-border hover:bg-surface-high disabled:opacity-50'
                  }`}
                >
                  {ROLE_LABEL[role]}
                </button>
              ))}
            </div>
            {user.role === user.role && (
              <p className="text-xs text-muted mt-2">
                El rol resaltado es el actual. Haz clic en otro para cambiarlo.
              </p>
            )}
          </div>

        </div>
      </aside>
    </>
  )
}
