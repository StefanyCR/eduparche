'use client'

import { HiSun, HiMoon } from 'react-icons/hi'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-provider'

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-xl',
        'text-secondary hover:text-foreground hover:bg-surface-high',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {isDark
        ? <HiSun  className="w-5 h-5 text-highlight" />
        : <HiMoon className="w-5 h-5" />
      }
    </button>
  )
}
