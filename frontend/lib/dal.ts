import { redirect } from 'next/navigation'
import { getServerSession } from './session'
import type { AuthUser } from './types'

/*
  DAL — Data Access Layer de autorización.

  Cada función verifica sesión + rol antes de devolver el usuario.
  Úsalas al inicio de cualquier layout o page.tsx que requiera permisos.

  Ejemplo:
    const user = await requireAdmin()   // redirige si no es ADMIN
    const user = await requireAuth()    // redirige si no hay sesión
*/

export async function requireAuth(): Promise<AuthUser> {
  return getServerSession()
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getServerSession()
  if (user.role !== 'ADMIN') redirect('/dashboard')
  return user
}

export async function requireTutor(): Promise<AuthUser> {
  const user = await getServerSession()
  if (user.role !== 'TUTOR' && user.role !== 'ADMIN') redirect('/dashboard')
  return user
}

export async function requireStudent(): Promise<AuthUser> {
  const user = await getServerSession()
  if (user.role !== 'STUDENT') redirect('/dashboard')
  return user
}
