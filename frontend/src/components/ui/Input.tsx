import { forwardRef, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

/**
 * Renders a styled native input with an optional invalid state.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', invalid = false, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={[
        'w-full rounded-md border bg-surface px-3 py-2 text-body text-text-primary',
        'placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-primary focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:bg-disabled-background',
        'disabled:text-disabled-text',
        invalid ? 'border-error focus-visible:ring-error' : 'border-border',
        className,
      ].join(' ')}
      {...props}
    />
  )
})
