import { requireAuth } from '@/lib/dal'
import DashboardShell from './dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
