import { requireAdmin } from '@/lib/dal'
import { cookies } from 'next/headers'
import UsuariosClient from './usuarios-client'
import type { AuthUser } from '@/lib/types'

type AdminUser = AuthUser & {
  minorRequest: { letter: string | null; status: string; createdAt: string } | null
}

// Pide la lista de usuarios al backend usando la cookie de sesión del admin
async function fetchUsers(): Promise<AdminUser[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('ep_token')
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

  const res = await fetch(`${backendUrl}/users`, {
    headers: { Cookie: `ep_token=${token?.value}` },
    cache: 'no-store', // siempre datos frescos, nunca del caché
  })

  if (!res.ok) return []
  return res.json()
}

export default async function UsuariosPage() {
  // Verifica que quien entra es admin (si no, redirige a /dashboard)
  await requireAdmin()
  const users = await fetchUsers()

  // Le pasa los datos al Client Component que maneja el drawer
  return <UsuariosClient users={users} />
}
