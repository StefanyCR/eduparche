'use client'

// Componente cliente del catálogo. Se encarga de:
// - Filtrar por nivel y por texto (en memoria, sobre lo que ya llegó)
// - Llamar al backend para inscribir
// - Refrescar los datos del Server Component tras inscribirse

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { CourseCard } from '@/components/domain/course-card'

// Forma exacta de lo que devuelve GET /api/v1/catalog.
// Declararla acá sirve de contrato: si el backend cambia un campo,
// TypeScript marca el error en vez de fallar en silencio en pantalla.
type CatalogCourse = {
  id: string
  slug: string
  title: string
  description: string
  thumbnail: string | null
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  totalLessons: number
  enrolledCount: number
  category: { name: string; slug: string } | null
  isEnrolled: boolean
  completedLessons: number
  progress: number
}

// El backend habla en inglés (enum de Prisma) y la interfaz en español.
// La traducción vive en un solo sitio para no repetirla por toda la UI.
const levelLabels = {
  BASIC:        'Básico',
  INTERMEDIATE: 'Intermedio',
  ADVANCED:     'Avanzado',
} as const

const FILTERS = [
  { value: 'ALL',          label: 'Todos' },
  { value: 'BASIC',        label: 'Básico' },
  { value: 'INTERMEDIATE', label: 'Intermedio' },
  { value: 'ADVANCED',     label: 'Avanzado' },
] as const

export default function CatalogoClient({
  courses,
  canEnroll,
}: {
  courses: CatalogCourse[]
  canEnroll: boolean
}) {
  const router = useRouter()

  const [level,     setLevel]     = useState<string>('ALL')
  const [search,    setSearch]    = useState('')
  const [enrolling, setEnrolling] = useState<string | null>(null) // slug en proceso
  const [error,     setError]     = useState('')

  // useMemo evita recalcular el filtrado en cada tecleo si nada cambió.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesLevel = level === 'ALL' || course.level === level
      const matchesTerm  = term === '' || course.title.toLowerCase().includes(term)
      return matchesLevel && matchesTerm
    })
  }, [courses, level, search])

  async function handleEnroll(course: CatalogCourse) {
    setEnrolling(course.slug)
    setError('')
    try {
      // Solo viaja el slug. El estudiante lo deduce el backend del token:
      // así nadie puede inscribir a otra persona manipulando el cuerpo.
      await api.post('/v1/enrollments', { courseSlug: course.slug })

      // Vuelve a ejecutar el Server Component y repinta con los datos frescos,
      // sin recargar la página entera.
      router.refresh()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const msg    = (err as { response?: { data?: { message?: string } } })?.response?.data?.message

      // Cada código tiene un significado distinto para el usuario.
      // Traducirlos acá evita mostrar un "error 409" que nadie entiende.
      // 409 y 422 se reescriben en segunda persona: el backend los redacta en
      // tercera porque el mismo mensaje lo consume la API de aliados.
      if (status === 409)      setError('Ya estás inscrito en este curso.')
      else if (status === 422) setError('Te falta completar el curso previo requerido.')
      else if (status === 403) setError('Tu rol no permite inscribirse en cursos.')
      else                     setError(msg ?? 'No se pudo completar la inscripción. Intenta de nuevo.')
    } finally {
      setEnrolling(null)
    }
  }

  const enrolledCount = courses.filter((course) => course.isEnrolled).length

  return (
    <div className="space-y-6">

      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
        <p className="text-sm text-secondary mt-1">
          {courses.length} curso{courses.length !== 1 ? 's' : ''} disponible{courses.length !== 1 ? 's' : ''}
          {enrolledCount > 0 && ` · estás inscrito en ${enrolledCount}`}
        </p>
      </div>

      {/* ── Buscador y filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar un curso…"
          className="flex-1 px-4 py-2 text-sm rounded-xl bg-surface border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setLevel(filter.value)}
              className={
                'px-3 py-2 text-xs font-medium rounded-xl border whitespace-nowrap transition-colors ' +
                (level === filter.value
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface border-border text-secondary hover:bg-surface-high')
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Aviso de error ── */}
      {error && (
        <div className="rounded-xl bg-danger-bg border border-danger/20 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* ── Grilla de cursos ── */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center mb-4 text-2xl">🔍</div>
          <p className="text-base font-semibold text-foreground">
            {courses.length === 0 ? 'Todavía no hay cursos publicados' : 'Ningún curso coincide'}
          </p>
          <p className="text-sm text-secondary mt-1">
            {courses.length === 0
              ? 'Cuando el equipo publique el primero, aparecerá acá'
              : 'Probá con otro término o quitá los filtros'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={course.description}
              level={levelLabels[course.level]}
              totalLessons={course.totalLessons}
              completedLessons={course.completedLessons}
              thumbnailUrl={course.thumbnail ?? undefined}
              // progress definido = inscrito. La tarjeta usa eso para decidir
              // si muestra "Continuar" o "Inscribirse".
              progress={course.isEnrolled ? course.progress : undefined}
              onEnroll={
                canEnroll && enrolling !== course.slug
                  ? () => handleEnroll(course)
                  : undefined
              }
              onContinue={() => router.push(`/catalogo/${course.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
