'use client'

// Formulario modal para crear o editar un curso.
// Mismo patrón que badge-form.tsx: el modal se muestra encima del contenido
// y el estado de guardado lo controla el componente padre.

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'

export type CourseFormData = {
  id?:             string
  title:           string
  slug:            string
  description:     string
  level:           'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  categoryId:      string
  status:          'DRAFT' | 'ACTIVE' | 'DISABLED'
  onlineHours:     string   // se maneja como texto en el input; se convierte a número al enviar
  autonomousHours: string
  thumbnail:       string
}

type Category = { id: string; name: string }

const LEVELS = [
  { value: 'BASIC',        label: 'Básico' },
  { value: 'INTERMEDIATE', label: 'Intermedio' },
  { value: 'ADVANCED',     label: 'Avanzado' },
] as const

const STATUSES = [
  { value: 'DRAFT',    label: 'Borrador — no aparece en el catálogo' },
  { value: 'ACTIVE',   label: 'Publicado — visible para estudiantes' },
  { value: 'DISABLED', label: 'Deshabilitado — retirado del catálogo' },
] as const

/**
 * Convierte un título en slug: "Introducción a Java" → "introduccion-a-java".
 *
 * `normalize('NFD')` separa cada letra acentuada en dos caracteres (letra +
 * tilde), y el reemplazo siguiente borra las tildes sueltas. Sin ese paso, la
 * "ó" quedaría fuera del patrón [a-z0-9] que exige el backend y el curso se
 * rechazaría con un 400.
 */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EMPTY: CourseFormData = {
  title: '', slug: '', description: '', level: 'BASIC',
  categoryId: '', status: 'DRAFT', onlineHours: '', autonomousHours: '', thumbnail: '',
}

export default function CursoForm({
  initial,    // con datos = modo edición; vacío = modo creación
  categories,
  onSave,
  onCancel,
  saving,
}: {
  initial?:   Partial<CourseFormData>
  categories: Category[]
  onSave:     (data: CourseFormData) => void
  onCancel:   () => void
  saving:     boolean
}) {
  const [form, setForm] = useState<CourseFormData>({
    ...EMPTY,
    ...initial,
    categoryId: initial?.categoryId ?? categories[0]?.id ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({})

  // Si se abre el formulario con otro curso, se recargan los valores.
  useEffect(() => {
    setForm({ ...EMPTY, ...initial, categoryId: initial?.categoryId ?? categories[0]?.id ?? '' })
    setErrors({})
  }, [initial?.id])

  const isEditing = Boolean(initial?.id)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      // Al CREAR, el slug se genera solo desde el título.
      // Al EDITAR no se toca: ya está en URLs y en sistemas externos,
      // así que cambiarlo rompería enlaces que ya circulan.
      if (name === 'title' && !isEditing) next.slug = slugify(value)
      return next
    })
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  /**
   * Valida con las MISMAS reglas que los DTO del backend.
   *
   * No sustituye la validación del servidor —esa es la que manda, porque el
   * navegador se puede saltar—, pero le ahorra al admin un viaje de ida y
   * vuelta para enterarse de que le faltaban caracteres.
   */
  function validate(): boolean {
    const next: typeof errors = {}
    if (form.title.trim().length < 5)                  next.title       = 'Mínimo 5 caracteres'
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) next.slug        = 'Solo minúsculas, números y guiones'
    if (form.description.trim().length < 20)           next.description = 'Mínimo 20 caracteres'
    if (!form.categoryId)                              next.categoryId  = 'Elegí una categoría'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl my-8">

        {/* Encabezado del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? 'Editar curso' : 'Nuevo curso'}
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          <Input
            label="Título del curso"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ej: Introducción a la Programación con Python"
            error={errors.title}
          />

          <Input
            label={isEditing ? 'Identificador en la URL (no editable)' : 'Identificador en la URL'}
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="intro-python"
            disabled={isEditing}
            error={errors.slug}
            hint={isEditing
              ? 'No se puede cambiar: ya está en enlaces y sistemas externos'
              : 'Se genera solo a partir del título'}
          />

          <Textarea
            label="Descripción"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="De qué trata el curso y qué se lleva quien lo termine"
            error={errors.description}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Nivel" name="level" value={form.level} onChange={handleChange}>
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>

            <Select
              label="Categoría"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              error={errors.categoryId}
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Horas guiadas"
              name="onlineHours"
              type="number"
              min="0"
              value={form.onlineHours}
              onChange={handleChange}
              placeholder="20"
            />
            <Input
              label="Horas autónomas"
              name="autonomousHours"
              type="number"
              min="0"
              value={form.autonomousHours}
              onChange={handleChange}
              placeholder="10"
            />
          </div>

          <Input
            label="URL de la imagen (opcional)"
            name="thumbnail"
            value={form.thumbnail}
            onChange={handleChange}
            placeholder="https://…"
          />

          <Select label="Estado" name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>

          {/* El estado es el campo que decide si el curso se ve en el catálogo,
              así que conviene decirlo explícitamente y no dejarlo implícito. */}
          {form.status === 'DRAFT' && (
            <p className="text-xs text-secondary bg-surface-high rounded-xl px-3 py-2">
              💡 En borrador el curso no aparece en el catálogo. Cambiá el estado a
              «Publicado» para que los estudiantes puedan inscribirse.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear curso'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
