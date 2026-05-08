'use client'

import { createContext, useContext } from 'react'
import type { AuthUser } from './types'

const UserContext = createContext<AuthUser | null>(null)

export function UserProvider({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

/*
  useUser — accede al usuario dentro de cualquier Client Component
  que esté dentro de DashboardShell (que provee el contexto).
*/
export function useUser(): AuthUser {
  const user = useContext(UserContext)
  if (!user) throw new Error('useUser debe usarse dentro de DashboardShell')
  return user
}
