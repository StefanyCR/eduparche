// Server Component: pide las insignias al backend y las pasa al componente cliente
import { requireAdmin } from '@/lib/dal'
import { cookies } from 'next/headers'
import GamificacionClient from './gamificacion-client'

async function fetchBadges() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ep_token')
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

  const res = await fetch(`${backendUrl}/badges`, {
    headers: { Cookie: `ep_token=${token?.value}` },
    cache: 'no-store',
  })

  if (!res.ok) return []
  return res.json()
}

export default async function GamificacionPage() {
  await requireAdmin()
  const badges = await fetchBadges()

  return <GamificacionClient badges={badges} />
}
