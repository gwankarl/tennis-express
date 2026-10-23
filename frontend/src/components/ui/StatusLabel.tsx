import type { HTMLAttributes, ReactNode } from 'react'

export type StatusTone = 'success' | 'warning' | 'error' | 'information' | 'neutral'

export interface StatusLabelProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-success-background text-success',
  warning: 'bg-warning-background text-warning',
  error: 'bg-error-background text-error',
  information: 'bg-information-background text-information',
  neutral: 'bg-disabled-background text-disabled-text',
}

/** Displays a short status using the matching design-system colors. */
export function StatusLabel({
  children,
  tone = 'neutral',
  className = '',
  ...props
}: StatusLabelProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-supporting font-medium',
        toneClasses[tone],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
