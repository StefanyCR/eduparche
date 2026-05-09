'use client'

// Formulario para crear o editar una insignia.
// Se muestra como modal (ventana encima del contenido).

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'

type BadgeData = {
  id?:         string
  name:        string
  description: string
  imageUrl?:   string | null  // null o undefined cuando viene de la BD sin imagen
  isActive:    boolean
}

export default function BadgeForm({
  initial,   // si viene con datos = modo edición, si viene vacío = modo creación
  onSave,    // se llama cuando el admin guarda el formulario
  onCancel,  // se llama cuando el admin cancela
  saving,    // true mientras se está enviando al backend
}: {
  initial?:  Partial<BadgeData>
  onSave:    (data: Omit<BadgeData, 'id'>) => void
  onCancel:  () => void
  saving:    boolean
}) {
  const [form, setForm] = useState({
    name:        initial?.name        ?? '',
    description: initial?.description ?? '',
    imageUrl:    initial?.imageUrl    ?? '',
    isActive:    initial?.isActive    ?? true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  // Si el admin abre el mismo formulario con datos distintos (editar otro registro), actualizamos
  useEffect(() => {
    setForm({
      name:        initial?.name        ?? '',
      description: initial?.description ?? '',
      imageUrl:    initial?.imageUrl    ?? '',
      isActive:    initial?.isActive    ?? true,
    })
    setErrors({})
  }, [initial?.id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    // Borramos el error del campo que el usuario está editando
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim())        next.name        = 'El nombre es obligatorio'
    if (!form.description.trim()) next.description = 'La descripción es obligatoria'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    onSave(form)
  }

  const isEditing = Boolean(initial?.id)

  return (
    // Fondo oscuro que cierra el modal al hacer clic fuera
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl">

        {/* Encabezado del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? 'Editar insignia' : 'Nueva insignia'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-secondary hover:bg-surface-high transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo del formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          <Input
            label="Nombre de la insignia"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej: Primer inicio de sesión"
            hint={errors.name}
          />

          <Textarea
            label="Descripción"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Ej: Otorgada al completar tu primer ingreso a la plataforma"
            rows={3}
            hint={errors.description}
          />

          <Input
            label="URL de imagen o ícono (opcional)"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            placeholder="https://... o deja vacío para usar un emoji"
          />

          {/* Preview de la imagen si el admin ingresó una URL */}
          {form.imageUrl && (
            <div className="flex items-center gap-3 p-3 bg-surface-high rounded-xl">
              <img
                src={form.imageUrl}
                alt="Preview"
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <p className="text-xs text-secondary">Vista previa del ícono</p>
            </div>
          )}

          {/* Toggle para activar o desactivar la insignia */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Insignia activa</p>
              <p className="text-xs text-secondary">Las inactivas no se pueden ganar ni mostrar</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.isActive ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.isActive ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear insignia'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
