export default function TutoriasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tutorías</h1>
        <p className="text-sm text-secondary mt-1">Sesiones en vivo con tutores expertos</p>
      </div>
      <ComingSoon />
    </div>
  )
}

function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center mb-4 text-2xl">
        🚧
      </div>
      <p className="text-sm font-medium text-foreground">Próximamente</p>
      <p className="text-xs text-secondary mt-1">Esta sección está en desarrollo</p>
    </div>
  )
}
