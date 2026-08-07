// Server Component: pide el catálogo al backend y se lo pasa al componente cliente.
//
// La petición se hace en el SERVIDOR, no en el navegador. Eso permite reenviar
// la cookie de sesión sin exponerla en JavaScript del cliente, y hace que la
// página llegue ya con los cursos pintados (nada de spinner inicial).
import { requireAuth } from '@/lib/dal'
import { cookies } from 'next/headers'
import CatalogoClient from './catalogo-client'

async function fetchCatalog() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ep_token')
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

  const res = await fetch(`${backendUrl}/v1/catalog?pageSize=50`, {
    headers: { Cookie: `ep_token=${token?.value}` },
    // no-store: el catálogo debe reflejar al instante una inscripción recién
    // hecha. Si Next lo cacheara, el botón seguiría diciendo "Inscribirse"
    // después de inscribirse.
    cache: 'no-store',
  })

  if (!res.ok) return []
  const body = await res.json()
  return body.items ?? []
}

export default async function CatalogoPage() {
  // requireAuth redirige a /login si no hay sesión. El rol se usa para decidir
  // si mostrar el botón de inscripción: solo los estudiantes se inscriben.
  const user = await requireAuth()
  const courses = await fetchCatalog()

  return <CatalogoClient courses={courses} canEnroll={user.role === 'STUDENT'} />
}
