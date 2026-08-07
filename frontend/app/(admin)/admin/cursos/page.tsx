// Server Component: trae los cursos y las categorías, y se los pasa al cliente.
//
// Se piden las DOS cosas en paralelo con Promise.all. Encadenar los await
// haría esperar la segunda petición a que termine la primera sin necesidad,
// porque no dependen entre sí.
import { requireAdmin } from '@/lib/dal'
import { cookies } from 'next/headers'
import CursosClient from './cursos-client'

async function fetchFromBackend(path: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('ep_token')
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

  const res = await fetch(`${backendUrl}${path}`, {
    headers: { Cookie: `ep_token=${token?.value}` },
    cache: 'no-store',
  })

  if (!res.ok) return null
  return res.json()
}

export default async function CursosAdminPage() {
  await requireAdmin()

  const [courses, categories] = await Promise.all([
    fetchFromBackend('/v1/courses?pageSize=100'),
    fetchFromBackend('/v1/courses/categories'),
  ])

  return (
    <CursosClient
      courses={courses?.items ?? []}
      categories={categories ?? []}
    />
  )
}
