import { cn } from '@/lib/utils'

type CheckboxProps = {
  label?: string
  error?: string
  hint?: string
} & Omit<React.ComponentProps<'input'>, 'type'>

export function Checkbox({ label, error, hint, className, id, disabled, ...props }: CheckboxProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-start gap-2.5',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        )}
      >
        {/* Wrapper posicional para superponer el checkmark sobre el input */}
        <span className="relative shrink-0 mt-0.5">
          <input
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className={cn(
              'peer appearance-none w-4 h-4 rounded border border-border bg-background',
              'checked:bg-primary checked:border-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'transition-all duration-150 cursor-pointer disabled:cursor-not-allowed',
              error && 'border-danger checked:bg-danger checked:border-danger',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {/* Checkmark — visible solo cuando está checked via peer */}
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            className="absolute inset-0 w-4 h-4 text-primary-fg opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-150"
          >
            <path
              d="M3.5 8L6.5 11L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {label && (
          <span className="text-sm text-foreground leading-snug">{label}</span>
        )}
      </label>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger ml-6" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-secondary ml-6">
          {hint}
        </p>
      )}
    </div>
  )
}
