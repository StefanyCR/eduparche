import { requireTutor } from '@/lib/dal'

export default async function MisEstudiantesPage() {
  await requireTutor()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis estudiantes</h1>
        <p className="text-sm text-secondary mt-1">Gestiona los estudiantes asignados a tus tutorías</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center mb-4 text-2xl">👥</div>
        <p className="text-base font-semibold text-foreground">Próximamente</p>
        <p className="text-sm text-secondary mt-1">La gestión de estudiantes estará disponible pronto</p>
      </div>
    </div>
  )
}
