import type { HTMLAttributes, ReactNode } from 'react'

interface ValidationMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

/**
 * Renders an accessible form validation message.
 */
export function ValidationMessage({ children, className = '', ...props }: ValidationMessageProps) {
  return (
    <p
      role="alert"
      className={['text-form-error font-regular text-error', className].join(' ')}
      {...props}
    >
      {children}
    </p>
  )
}
