import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

/** Explains that a section has no content to display. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <h2 className="text-card-heading font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 text-supporting text-text-secondary">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  )
}
