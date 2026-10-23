import type { ReactNode } from 'react'

interface SuccessStateProps {
  title: string
  description: string
  action?: ReactNode
}

/** Confirms that an operation completed successfully. */
export function SuccessState({ title, description, action }: SuccessStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-xl border border-success bg-success-background p-4"
    >
      <h2 className="text-card-heading font-semibold text-success">{title}</h2>
      <p className="mt-2 text-supporting text-text-primary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  )
}
