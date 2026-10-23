import type { LabelHTMLAttributes, ReactNode } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
  required?: boolean
}

/**
 * Renders a form label and an optional visible required indicator.
 */
export function Label({ children, required = false, className = '', ...props }: LabelProps) {
  return (
    <label
      className={['text-form-label font-medium text-text-primary', className].join(' ')}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="ml-1 text-error">
          (required)
        </span>
      )}
    </label>
  )
}
