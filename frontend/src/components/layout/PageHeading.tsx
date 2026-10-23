import type { ReactNode } from 'react'

export interface PageHeadingProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Provides a consistent title, optional description, and optional page action. */
export function PageHeading({ title, description, action }: PageHeadingProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-page-title font-bold text-text-primary">{title}</h1>
        {description && <p className="mt-2 text-body text-text-secondary">{description}</p>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
