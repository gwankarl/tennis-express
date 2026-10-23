import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  presentation?: 'modal' | 'drawer'
}

/**
 * Renders an accessible modal or right-side drawer using the native dialog element.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  presentation = 'modal',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    // Let React control the open state while still allowing Escape to dismiss the dialog.
    event.preventDefault()
    onOpenChange(false)
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      onOpenChange(false)
    }
  }

  const layoutClasses =
    presentation === 'drawer'
      ? 'm-0 ml-auto h-dvh max-h-none w-full max-w-md rounded-none'
      : 'm-auto w-[calc(100%-2rem)] max-w-lg rounded-xl'

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={[
        'border border-border bg-surface p-0 text-text-primary shadow-xl',
        'backdrop:bg-black/40',
        layoutClasses,
      ].join(' ')}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-section-heading font-semibold text-text-primary">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-2 text-supporting text-text-secondary">
                {description}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="small"
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
          >
            <span aria-hidden="true">&times;</span>
          </Button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </dialog>
  )
}
