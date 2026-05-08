import { getServerSession } from '@/lib/session'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AuthUser } from '@/lib/types'

const roleLabels: Record<AuthUser['role'], string> = {
  STUDENT:    'Estudiante',
  TUTOR:      'Tutor',
  ADMIN:      'Administrador',
}

/*
  Server Component — getServerSession() está memoizada con React cache(),
  así que si el layout ya la llamó en este request, no hay una segunda
  petición al backend: Next.js reutiliza el resultado.
*/
export default async function DashboardPage() {
  const user    = await getServerSession()
  const profile = user.profile
  const displayName = profile?.displayName ?? `${profile?.firstName} ${profile?.lastName}`
  const initials    = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hola, <span className="text-primary">{profile?.firstName}</span> 👋
        </h1>
        <p className="text-sm text-secondary mt-1">Continúa donde lo dejaste</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard label="Puntos XP"      value={String(user.totalPoints)} color="text-primary"   icon="⚡" />
        <StatCard label="Cursos activos" value="0"                        color="text-accent"    icon="📚" />
        <StatCard label="Logros"         value="0"                        color="text-highlight" icon="🏆" />
      </div>

      {/* Perfil + Cuenta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                {initials}
              </div>
              <div>
                <CardTitle>{displayName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <InfoRow label="Rol">
              <Badge variant="primary">{roleLabels[user.role]}</Badge>
            </InfoRow>
            {profile?.city   && <InfoRow label="Ciudad"    value={profile.city} />}
            {profile?.phone  && <InfoRow label="Teléfono"  value={profile.phone} />}
            {profile?.bio    && <InfoRow label="Biografía" value={profile.bio} />}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cuenta</CardTitle></CardHeader>
          <div className="space-y-3">
            <InfoRow label="Estado">
              <Badge variant={user.status === 'ACTIVE' ? 'success' : 'warning'}>
                {user.status === 'ACTIVE' ? 'Activa' : user.status}
              </Badge>
            </InfoRow>
            <InfoRow label="Tipo de documento"   value={profile?.documentType   ?? '—'} />
            <InfoRow label="Número de documento" value={profile?.documentNumber ?? '—'} />
            <InfoRow
              label="Miembro desde"
              value={new Date(user.createdAt).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            />
          </div>
        </Card>
      </div>

      {/* Mis cursos placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Mis cursos</CardTitle>
          <CardDescription>Cursos en los que estás inscrito</CardDescription>
        </CardHeader>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-high flex items-center justify-center mb-3 text-xl">📚</div>
          <p className="text-sm font-medium text-foreground">Aún no estás inscrito en ningún curso</p>
          <p className="text-xs text-secondary mt-1">Explora el catálogo y empieza a aprender</p>
        </div>
      </Card>

    </div>
  )
}

function StatCard({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: string
}) {
  return (
    <Card padding="sm">
      <p className="text-xl mb-1">{icon}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-secondary mt-0.5">{label}</p>
    </Card>
  )
}

function InfoRow({ label, value, children }: {
  label: string; value?: string; children?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-secondary shrink-0">{label}</span>
      {children ?? <span className="text-xs text-foreground text-right">{value}</span>}
    </div>
  )
}
