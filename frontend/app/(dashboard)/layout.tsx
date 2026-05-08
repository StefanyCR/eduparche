import { getServerSession } from '@/lib/session'
import DashboardShell from './dashboard-shell'

/*
  Server Component — corre en el servidor antes de enviar HTML al browser.
  Lee la cookie, valida la sesión con el backend y pasa el usuario
  a DashboardShell como prop. Si no hay sesión válida, getServerSession()
  redirige a /login automáticamente.
*/
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSession()

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
