interface LoadingStateProps {
  /** Accessible text announced while content is loading. */
  label?: string
}

/** Displays an accessible loading indicator. */
export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 text-text-secondary">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-border border-t-primary"
      />
      <span className="text-body">{label}</span>
    </div>
  )
}
