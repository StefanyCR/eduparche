'use client'

// Componente cliente que maneja:
// - El estado del modal (abierto/cerrado, modo crear o editar)
// - Las llamadas al backend (crear, editar, eliminar insignias)
// - La lista de insignias recibida del Server Component

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import BadgeForm from './badge-form'

type BadgeItem = {
  id:          string
  name:        string
  description: string
  imageUrl:    string | null
  isActive:    boolean
  createdAt:   string
  _count:      { users: number }
}

export default function GamificacionClient({ badges }: { badges: BadgeItem[] }) {
  const router = useRouter()

  // null = modal cerrado | undefined = crear nueva | BadgeItem = editar existente
  const [editing, setEditing]   = useState<BadgeItem | undefined | null>(null)
  const [saving,  setSaving]    = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null) // id de la insignia que se está borrando
  const [error,   setError]     = useState('')

  // Crea o edita según si `editing` tiene id o no
  async function handleSave(data: { name: string; description: string; imageUrl?: string | null; isActive: boolean }) {
    setSaving(true)
    setError('')
    // Convertimos cadena vacía a null para no guardar URLs en blanco en la BD
    const payload = { ...data, imageUrl: data.imageUrl || null }
    try {
      if (editing?.id) {
        await api.patch(`/badges/${editing.id}`, payload)
      } else {
        await api.post('/badges', payload)
      }
      setEditing(null)
      router.refresh() // refresca los datos del Server Component sin recargar la página
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Ocurrió un error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(badge: BadgeItem) {
    // Confirmación nativa del navegador antes de borrar
    if (!confirm(`¿Eliminar la insignia "${badge.name}"? Esta acción no se puede deshacer.`)) return

    setDeleting(badge.id)
    setError('')
    try {
      await api.delete(`/badges/${badge.id}`)
      router.refresh()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'No se pudo eliminar la insignia.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="space-y-6">

        {/* ── Encabezado con botón de crear ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Insignias</h1>
            <p className="text-sm text-secondary mt-1">
              {badges.length} insignia{badges.length !== 1 ? 's' : ''} creada{badges.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Al hacer clic, editing = undefined para indicar "modo crear" */}
          <Button onClick={() => setEditing(undefined)}>
            + Nueva insignia
          </Button>
        </div>

        {/* Error global (ej: al borrar una que ya fue otorgada) */}
        {error && (
          <div className="rounded-xl bg-danger-bg border border-danger/20 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* ── Lista de insignias ── */}
        {badges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center mb-4 text-2xl">⭐</div>
            <p className="text-base font-semibold text-foreground">Sin insignias todavía</p>
            <p className="text-sm text-secondary mt-1">Crea la primera para empezar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl"
              >
                {/* Ícono o placeholder */}
                <div className="w-12 h-12 rounded-xl bg-surface-high border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {badge.imageUrl ? (
                    <img src={badge.imageUrl} alt={badge.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">⭐</span>
                  )}
                </div>

                {/* Información de la insignia */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{badge.name}</p>
                    <Badge variant={badge.isActive ? 'success' : 'default'}>
                      {badge.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary line-clamp-2">{badge.description}</p>
                  {/* Cuántos usuarios ya ganaron esta insignia */}
                  <p className="text-xs text-muted mt-1">
                    {badge._count.users === 0
                      ? 'Nadie la tiene aún'
                      : `${badge._count.users} usuario${badge._count.users !== 1 ? 's' : ''} la tiene${badge._count.users !== 1 ? 'n' : ''}`}
                  </p>
                </div>

                {/* Botones editar / eliminar */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditing(badge)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border text-secondary hover:bg-surface-high transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(badge)}
                    disabled={deleting === badge.id || badge._count.users > 0}
                    title={badge._count.users > 0 ? 'No se puede eliminar: ya fue otorgada a usuarios' : ''}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-danger/30 text-danger hover:bg-danger-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleting === badge.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal del formulario — solo visible cuando editing no es null */}
      {editing !== null && (
        <BadgeForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}
    </>
  )
}
