import { Button } from './Button'
import { Dialog } from './Dialog'

export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  isConfirming?: boolean
}

/** Asks the user to confirm an action before calling its handler. */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  isConfirming = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    if (isConfirming) return

    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={handleConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? 'Please wait…' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
