import { Button } from '../ui/Button'

interface ErrorStateProps {
  title?: string
  description: string
  onRetry?: () => void
  retryLabel?: string
}

/** Presents an error and an optional retry action. */
export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <section role="alert" className="rounded-xl border border-error bg-error-background p-4">
      <h2 className="text-card-heading font-semibold text-error">{title}</h2>
      <p className="mt-2 text-supporting text-text-primary">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </section>
  )
}
