import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AuthUser } from './types'

/*
  getServerSession — solo para Server Components.

  Usa React cache() para que si varias partes del árbol de servidor la
  llaman en el mismo request (layout + page), solo haya una llamada real
  al backend. Next.js deduplica automáticamente.
*/
export const getServerSession = cache(async (): Promise<AuthUser> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('ep_token')

  if (!token) redirect('/login')

  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

  let res: Response
  try {
    res = await fetch(`${backendUrl}/users/me`, {
      headers: { Cookie: `ep_token=${token.value}` },
      cache: 'no-store',
    })
  } catch {
    redirect('/login')
  }

  if (!res.ok) redirect('/login')

  return res.json() as Promise<AuthUser>
})
