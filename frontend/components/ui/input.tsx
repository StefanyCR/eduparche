import { cn } from '@/lib/utils'

type InputProps = {
  label?: string
  error?: string
  hint?: string
} & React.ComponentProps<'input'>

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {label}
          {props.required && (
            <span className="text-danger ml-0.5" aria-hidden>*</span>
          )}
        </label>
      )}

      <input
        id={inputId}
        className={cn(
          'w-full bg-surface border rounded-xl px-3.5 py-2.5 text-sm text-foreground',
          'placeholder:text-muted',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-danger focus:ring-danger'
            : 'border-border hover:border-border-strong',
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-secondary">
          {hint}
        </p>
      )}
    </div>
  )
}

/* Versión Select con la misma apariencia */
type SelectProps = {
  label?: string
  error?: string
} & React.ComponentProps<'select'>

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-danger ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full bg-surface border rounded-xl px-3.5 py-2.5 text-sm text-foreground',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-danger focus:ring-danger'
            : 'border-border hover:border-border-strong',
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  )
}

/* Textarea */
type TextareaProps = {
  label?: string
  error?: string
  hint?: string
} & React.ComponentProps<'textarea'>

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        className={cn(
          'w-full bg-surface border rounded-xl px-3.5 py-2.5 text-sm text-foreground',
          'placeholder:text-muted resize-none',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          error ? 'border-danger' : 'border-border hover:border-border-strong',
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      {hint && !error && <p className="text-xs text-secondary">{hint}</p>}
    </div>
  )
}
