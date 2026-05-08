import { cn } from '@/lib/utils'

type SwitchProps = {
  label?: string
  hint?: string
  error?: string
} & Omit<React.ComponentProps<'input'>, 'type'>

export function Switch({ label, hint, error, className, id, disabled, ...props }: SwitchProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-center gap-3',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        )}
      >
        {/*
          Estructura: un input[type=checkbox] oculto (el verdadero switch) + un span para el track y otro para el thumb.
          El track cambia de color con peer-checked, y el thumb se mueve con peer-checked:translate-x.
        */}
        <span
          className={cn(
            'relative flex w-10 h-6 shrink-0 rounded-full',
            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
          )}
        >
          <input
            id={inputId}
            type="checkbox"
            role="switch"
            disabled={disabled}
            className={cn('peer sr-only', className)}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {/* Track */}
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-full transition-colors duration-200',
              'bg-surface-high peer-checked:bg-primary',
              error && 'peer-checked:bg-danger',
            )}
          />
          {/* Thumb */}
          <span
            aria-hidden
            className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4"
          />
        </span>

        {label && (
          <span className="text-sm text-foreground">{label}</span>
        )}
      </label>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger ml-[52px]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-secondary ml-[52px]">
          {hint}
        </p>
      )}
    </div>
  )
}
