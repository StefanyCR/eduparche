import { cn } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type AvatarProps = {
  src?: string | null
  name?: string
  size?: AvatarSize
  className?: string
}

const sizes: Record<AvatarSize, string> = {
  xs: 'w-6  h-6  text-[10px]',
  sm: 'w-8  h-8  text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

function getInitials(name?: string): string {
  if (!name?.trim()) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <div
      aria-label={name ?? 'Usuario'}
      className={cn(
        'rounded-full bg-primary/10 border border-primary/20 shrink-0 overflow-hidden',
        'flex items-center justify-center font-semibold text-primary select-none',
        sizes[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

/* Grupo de avatares apilados */
type AvatarGroupProps = {
  avatars: { src?: string | null; name?: string }[]
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarGroup({ avatars, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visible  = avatars.slice(0, max)
  const overflow = avatars.length - max

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((a, i) => (
        <Avatar
          key={i}
          src={a.src}
          name={a.name}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'rounded-full bg-surface-high border-2 border-background ring-2 ring-background',
            'flex items-center justify-center text-xs font-semibold text-secondary shrink-0',
            sizes[size],
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
