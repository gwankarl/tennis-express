import { Button } from '../ui/Button'

export type NotificationTone = 'success' | 'warning' | 'error' | 'information'

export interface NotificationProps {
  title: string
  message: string
  tone?: NotificationTone
  onDismiss?: () => void
}

const toneClasses: Record<NotificationTone, string> = {
  success: 'border-success bg-success-background text-success',
  warning: 'border-warning bg-warning-background text-warning',
  error: 'border-error bg-error-background text-error',
  information: 'border-information bg-information-background text-information',
}

/** Announces a feedback message and optionally provides a dismiss action. */
export function Notification({
  title,
  message,
  tone = 'information',
  onDismiss,
}: NotificationProps) {
  const role = tone === 'error' ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={[
        'flex items-start justify-between gap-4 rounded-lg border p-4',
        toneClasses[tone],
      ].join(' ')}
    >
      <div>
        <p className="text-card-heading font-semibold">{title}</p>
        <p className="mt-1 text-supporting text-text-primary">{message}</p>
      </div>

      {onDismiss && (
        <Button
          variant="outline"
          size="small"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <span aria-hidden="true">&times;</span>
        </Button>
      )}
    </div>
  )
}
