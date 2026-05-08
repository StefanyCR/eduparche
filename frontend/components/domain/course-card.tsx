import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

type Level = 'Básico' | 'Intermedio' | 'Avanzado'

type CourseCardProps = {
  title: string
  description?: string
  level: Level
  progress?: number          // 0-100; undefined = not enrolled
  totalLessons: number
  completedLessons?: number
  thumbnailUrl?: string
  onEnroll?: () => void
  onContinue?: () => void
  className?: string
}

const levelVariant: Record<Level, 'primary' | 'accent' | 'highlight'> = {
  Básico:      'primary',
  Intermedio:  'accent',
  Avanzado:    'highlight',
}

export function CourseCard({
  title,
  description,
  level,
  progress,
  totalLessons,
  completedLessons = 0,
  thumbnailUrl,
  onEnroll,
  onContinue,
  className,
}: CourseCardProps) {
  const isEnrolled = progress !== undefined

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-surface overflow-hidden',
        'hover:border-primary/40 transition-colors duration-200',
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-surface-high shrink-0">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none opacity-30">
            📚
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={levelVariant[level]}>{level}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{title}</h3>
          {description && (
            <p className="text-xs text-secondary mt-1 line-clamp-2 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="text-xs text-muted">
          {isEnrolled
            ? `${completedLessons} / ${totalLessons} lecciones`
            : `${totalLessons} lecciones`}
        </div>

        {isEnrolled && (
          <Progress value={progress!} size="sm" variant="primary" />
        )}

        <Button
          variant={isEnrolled ? 'outline' : 'solid'}
          size="sm"
          className="w-full"
          onClick={isEnrolled ? onContinue : onEnroll}
        >
          {isEnrolled ? 'Continuar' : 'Inscribirse'}
        </Button>
      </div>
    </div>
  )
}
