'use client'

// Componente cliente de la administración de cursos. Maneja:
// - El modal de crear/editar
// - Las llamadas al backend (POST para crear, PATCH para editar y publicar)
// - Los mensajes de error traducidos a algo que el admin entienda

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CursoForm, { type CourseFormData } from './curso-form'

type AdminCourse = {
  id:              string
  slug:            string
  title:           string
  description:     string
  thumbnail:       string | null
  level:           'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  status:          'DRAFT' | 'ACTIVE' | 'DISABLED'
  categoryId:      string
  onlineHours:     number | null
  autonomousHours: number | null
  category:        { id: string; name: string } | null
  _count:          { enrollments: number; modules: number }
}

type Category = { id: string; name: string }

const levelLabels = {
  BASIC: 'Básico', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado',
} as const

const statusLabels = {
  DRAFT: 'Borrador', ACTIVE: 'Publicado', DISABLED: 'Deshabilitado',
} as const

const statusVariants = {
  DRAFT: 'warning', ACTIVE: 'success', DISABLED: 'default',
} as const

export default function CursosClient({
  courses,
  categories,
}: {
  courses: AdminCourse[]
  categories: Category[]
}) {
  const router = useRouter()

  // null = modal cerrado | undefined = crear | AdminCourse = editar
  const [editing,   setEditing]   = useState<AdminCourse | undefined | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [toggling,  setToggling]  = useState<string | null>(null)
  const [error,     setError]     = useState('')

  /**
   * Convierte lo que tiene el formulario (todo texto) al cuerpo que espera
   * el backend. Los campos numéricos vacíos se envían como undefined, no como
   * cadena vacía: `""` no pasaría la validación @IsInt del DTO.
   */
  function toPayload(data: CourseFormData) {
    return {
      title:           data.title.trim(),
      description:     data.description.trim(),
      level:           data.level,
      categoryId:      data.categoryId,
      status:          data.status,
      thumbnail:       data.thumbnail.trim() || undefined,
      onlineHours:     data.onlineHours     ? Number(data.onlineHours)     : undefined,
      autonomousHours: data.autonomousHours ? Number(data.autonomousHours) : undefined,
    }
  }

  async function handleSave(data: CourseFormData) {
    setSaving(true)
    setError('')
    try {
      if (editing?.id) {
        // PATCH y no PUT: se mandan solo los campos del formulario.
        // Con PUT habría que enviar el curso COMPLETO y los omitidos
        // quedarían en null, borrando datos sin querer.
        await api.patch(`/v1/courses/${editing.id}`, toPayload(data))
      } else {
        // Al crear sí viaja el slug: es la única vez que se puede definir.
        await api.post('/v1/courses', { ...toPayload(data), slug: data.slug })
      }
      setEditing(null)
      router.refresh()
    } catch (err: unknown) {
      setError(readError(err, 'No se pudo guardar el curso.'))
    } finally {
      setSaving(false)
    }
  }

  /**
   * Publicar o retirar con un solo clic.
   *
   * Es el caso de uso que justifica PATCH: se manda un único campo
   * ({"status": "ACTIVE"}) sin tocar el resto del curso.
   */
  async function handleToggleStatus(course: AdminCourse) {
    const next = course.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    setToggling(course.id)
    setError('')
    try {
      await api.patch(`/v1/courses/${course.id}`, { status: next })
      router.refresh()
    } catch (err: unknown) {
      setError(readError(err, 'No se pudo cambiar el estado del curso.'))
    } finally {
      setToggling(null)
    }
  }

  return (
    <>
      <div className="space-y-6">

        {/* ── Encabezado ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
            <p className="text-sm text-secondary mt-1">
              {courses.length} curso{courses.length !== 1 ? 's' : ''} ·{' '}
              {courses.filter((c) => c.status === 'ACTIVE').length} publicado
              {courses.filter((c) => c.status === 'ACTIVE').length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setEditing(undefined)}>+ Nuevo curso</Button>
        </div>

        {error && (
          <div className="rounded-xl bg-danger-bg border border-danger/20 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Aviso si no hay categorías: sin ellas no se puede crear un curso,
            porque categoryId es obligatorio en el modelo. */}
        {categories.length === 0 && (
          <div className="rounded-xl bg-surface-high border border-border px-4 py-3 text-sm text-secondary">
            No hay categorías cargadas. Hay que crear al menos una antes de poder
            registrar cursos.
          </div>
        )}

        {/* ── Listado ── */}
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center mb-4 text-2xl">📚</div>
            <p className="text-base font-semibold text-foreground">Todavía no hay cursos</p>
            <p className="text-sm text-secondary mt-1">Creá el primero para que aparezca en el catálogo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-high border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📘</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{course.title}</p>
                    <Badge variant={statusVariants[course.status]}>{statusLabels[course.status]}</Badge>
                    <Badge variant="primary">{levelLabels[course.level]}</Badge>
                  </div>
                  <p className="text-xs text-secondary line-clamp-2">{course.description}</p>
                  <p className="text-xs text-muted mt-1">
                    /{course.slug} · {course.category?.name ?? 'Sin categoría'} ·{' '}
                    {course._count.modules} módulo{course._count.modules !== 1 ? 's' : ''} ·{' '}
                    {course._count.enrollments} inscrito{course._count.enrollments !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditing(course)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border text-secondary hover:bg-surface-high transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(course)}
                    disabled={toggling === course.id}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                  >
                    {toggling === course.id
                      ? '...'
                      : course.status === 'ACTIVE' ? 'Retirar' : 'Publicar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing !== null && (
        <CursoForm
          initial={editing ? toFormData(editing) : undefined}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}
    </>
  )
}

/** Pasa un curso de la API a la forma que espera el formulario (todo texto). */
function toFormData(course: AdminCourse): Partial<CourseFormData> {
  return {
    id:              course.id,
    title:           course.title,
    slug:            course.slug,
    description:     course.description,
    level:           course.level,
    categoryId:      course.categoryId,
    status:          course.status,
    onlineHours:     course.onlineHours?.toString()     ?? '',
    autonomousHours: course.autonomousHours?.toString() ?? '',
    thumbnail:       course.thumbnail ?? '',
  }
}

/**
 * Saca un mensaje legible de un error de axios.
 *
 * El backend manda `message` como string para los errores de negocio y como
 * array cuando falla la validación (una entrada por regla incumplida).
 * Hay que contemplar los dos casos o el admin ve "[object Object]".
 */
function readError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
  if (Array.isArray(data?.message)) return data.message.join(' · ')
  return data?.message ?? fallback
}
