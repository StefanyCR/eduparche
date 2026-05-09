import { requireAdmin } from '@/lib/dal'
import AdminShell from './admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return <AdminShell user={user}>{children}</AdminShell>
}
