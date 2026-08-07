// Ficha de un curso: descripción y temario (módulos y lecciones).
//
// Es un Server Component puro: no tiene estado ni interacción, así que no
// necesita 'use client'. Todo se resuelve en el servidor y llega HTML listo.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/dal'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Lesson = {
  id: string
  title: string
  description: string | null
  order: number
  isRequired: boolean
  _count: { materials: number }
}

type CourseDetail = {
  slug: string
  title: string
  description: string
  thumbnail: string | null
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  onlineHours: number | null
  autonomousHours: number | null
  totalLessons: number
  enrolledCount: number
  category: { name: string; slug: string } | null
  skills: { name: string; slug: string }[]
  modules: {
    id: string
    title: string
    description: string | null
    order: number
    lessons: Lesson[]
  }[]
}

const levelLabels = {
  BASIC:        'Básico',
  INTERMEDIATE: 'Intermedio',
  ADVANCED:     'Avanzado',
} as const

async function fetchCourse(slug: string): Promise<CourseDetail | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('ep_token')
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

  const res = await fetch(`${backendUrl}/v1/catalog/${slug}`, {
    headers: { Cookie: `ep_token=${token?.value}` },
    cache: 'no-store',
  })

  // El backend responde 404 si el curso no existe o no está publicado.
  // Se traduce a null y la página lo convierte en el 404 de Next.
  if (!res.ok) return null
  return res.json()
}

export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await requireAuth()

  // En Next 15 los params llegan como promesa y hay que esperarlos.
  const { slug } = await params
  const course = await fetchCourse(slug)

  if (!course) notFound()

  return (
    <div className="space-y-6">

      {/* ── Migaja de navegación ── */}
      <Link href="/catalogo" className="text-xs text-secondary hover:text-foreground transition-colors">
        ← Volver al catálogo
      </Link>

      {/* ── Encabezado ── */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="primary">{levelLabels[course.level]}</Badge>
          {course.category && <Badge variant="default">{course.category.name}</Badge>}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
        <p className="text-sm text-secondary mt-2 leading-relaxed">{course.description}</p>
      </div>

      {/* ── Datos rápidos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <FactCard label="Lecciones"   value={String(course.totalLessons)} />
        <FactCard label="Módulos"     value={String(course.modules.length)} />
        <FactCard label="Horas guiadas" value={course.onlineHours ? `${course.onlineHours} h` : '—'} />
        <FactCard label="Inscritos"   value={String(course.enrolledCount)} />
      </div>

      {/* ── Habilidades ── */}
      {course.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {course.skills.map((skill) => (
            <Badge key={skill.slug} variant="accent">{skill.name}</Badge>
          ))}
        </div>
      )}

      {/* ── Temario ── */}
      <Card>
        <CardHeader>
          <CardTitle>Temario</CardTitle>
          <CardDescription>Lo que vas a ver en el curso</CardDescription>
        </CardHeader>

        {course.modules.length === 0 ? (
          <p className="text-sm text-secondary py-6 text-center">
            El contenido de este curso todavía se está preparando.
          </p>
        ) : (
          <div className="space-y-5">
            {course.modules.map((module) => (
              <div key={module.id}>
                <p className="text-sm font-semibold text-foreground">
                  {module.order}. {module.title}
                </p>
                {module.description && (
                  <p className="text-xs text-secondary mt-0.5">{module.description}</p>
                )}

                <ul className="mt-2 space-y-1.5">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-start gap-2 text-xs text-secondary pl-3 border-l border-border"
                    >
                      <span className="text-muted shrink-0">▸</span>
                      <span className="flex-1">
                        {lesson.title}
                        {!lesson.isRequired && (
                          <span className="text-muted"> · opcional</span>
                        )}
                      </span>
                      {/* Se dice CUÁNTOS materiales hay, nunca dónde están:
                          el contenido es el producto y solo se entrega dentro
                          del curso, a quien esté inscrito. */}
                      <span className="text-muted shrink-0">
                        {lesson._count.materials} recurso{lesson._count.materials !== 1 ? 's' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-xs text-secondary mt-0.5">{label}</p>
    </div>
  )
}
