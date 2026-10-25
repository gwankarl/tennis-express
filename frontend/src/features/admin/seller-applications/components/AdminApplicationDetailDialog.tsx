import { useState } from 'react'
import { Button } from '../../../../components/ui/Button'
import { ConfirmationDialog } from '../../../../components/ui/ConfirmationDialog'
import { Dialog } from '../../../../components/ui/Dialog'
import { StatusLabel, type StatusTone } from '../../../../components/ui/StatusLabel'
import type { AdminApplicationDetails } from '../types'

interface AdminApplicationDetailDialogProps {
  application: AdminApplicationDetails
  open: boolean
  isMutating: boolean
  onClose: () => void
  onApprove: () => void
  onReject: (reason: string) => void
}

const statusTone: Record<AdminApplicationDetails['application']['status'], StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

type ReviewAction = 'approve' | 'reject' | null

/** Shows full application details and confirms administrator decisions. */
export function AdminApplicationDetailDialog({
  application: result,
  open,
  isMutating,
  onClose,
  onApprove,
  onReject,
}: AdminApplicationDetailDialogProps) {
  const [reason, setReason] = useState('')
  const [confirmationAction, setConfirmationAction] = useState<ReviewAction>(null)
  const { application, applicant } = result
  const data = application.applicationData

  const confirmAction = () => {
    if (confirmationAction === 'approve') onApprove()
    if (confirmationAction === 'reject') onReject(reason.trim())
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isMutating) onClose()
        }}
        title="Seller application"
        description={`Submitted ${new Date(application.submittedAt).toLocaleString()}`}
        presentation="drawer"
      >
        <div className="max-h-[calc(100dvh-12rem)] space-y-6 overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusLabel tone={statusTone[application.status]}>{application.status}</StatusLabel>
            {application.reviewedAt && (
              <p className="text-supporting text-text-secondary">
                Reviewed {new Date(application.reviewedAt).toLocaleString()}
              </p>
            )}
          </div>

          <section className="space-y-3">
            <h3 className="text-card-heading font-semibold">Applicant</h3>
            <dl className="grid gap-2 text-supporting sm:grid-cols-2">
              <div>
                <dt className="font-medium">Name</dt>
                <dd className="wrap-break-word text-text-secondary">
                  {applicant?.userName ?? 'Unavailable'}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Email</dt>
                <dd className="break-all text-text-secondary">
                  {applicant?.email ?? 'Unavailable'}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Account status</dt>
                <dd className="text-text-secondary">{applicant?.status ?? 'Unavailable'}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h3 className="text-card-heading font-semibold">Business details</h3>
            <dl className="grid gap-2 text-supporting sm:grid-cols-2">
              <div>
                <dt className="font-medium">Seller type</dt>
                <dd>{data.businessDetails.sellerType}</dd>
              </div>
              <div>
                <dt className="font-medium">Business name</dt>
                <dd>{data.businessDetails.businessName || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium">Store name</dt>
                <dd>{data.businessDetails.storeName || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium">Registration number</dt>
                <dd>{data.businessDetails.businessRegistrationNumber || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium">Phone</dt>
                <dd>{data.contactDetails.phoneNumber}</dd>
              </div>
              <div>
                <dt className="font-medium">Location</dt>
                <dd>
                  {data.contactDetails.city}, {data.contactDetails.region}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium">Address</dt>
                <dd className="text-text-secondary">{data.contactDetails.address}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-2">
            <h3 className="text-card-heading font-semibold">Product and fulfillment details</h3>
            <p className="whitespace-pre-wrap text-supporting text-text-secondary">
              {data.productDetails.businessDescription}
            </p>
            <p className="text-supporting text-text-secondary">
              Sourcing: {data.productDetails.sourcingMethods.join(', ')}
              {data.productDetails.otherSourcingMethod
                ? ` (${data.productDetails.otherSourcingMethod})`
                : ''}
            </p>
            <p className="text-supporting text-text-secondary">
              Fulfillment: {data.fulfilmentDetails.methods.join(', ')} · Dispatch{' '}
              {data.fulfilmentDetails.dispatchTime.replaceAll('_', ' ')}
            </p>
            <p className="text-supporting text-text-secondary">
              Service regions: {data.fulfilmentDetails.serviceRegions.join(', ')}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-card-heading font-semibold">Declarations</h3>
            <ul className="list-inside list-disc text-supporting text-text-secondary">
              <li>
                Information is accurate: {data.declarations.informationIsAccurate ? 'Yes' : 'No'}
              </li>
              <li>
                Seller policy accepted: {data.declarations.sellerPolicyAccepted ? 'Yes' : 'No'}
              </li>
              <li>
                Products are genuine and legally sellable:{' '}
                {data.declarations.productsAreGenuineAndLegallySellable ? 'Yes' : 'No'}
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-card-heading font-semibold">Supporting documents</h3>
            {data.supportingDocuments.length ? (
              <ul className="grid gap-2">
                {data.supportingDocuments.map((document) => (
                  <li key={document.publicId}>
                    <a
                      href={document.secureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-supporting text-primary underline"
                    >
                      {document.fileName} · {document.documentType.replaceAll('_', ' ')}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-supporting text-text-secondary">No supporting documents.</p>
            )}
          </section>

          {application.decisionReason && (
            <section className="space-y-2">
              <h3 className="text-card-heading font-semibold">Decision reason</h3>
              <p className="whitespace-pre-wrap text-supporting text-text-secondary">
                {application.decisionReason}
              </p>
            </section>
          )}

          {application.status === 'pending' && (
            <section className="space-y-3 border-t border-border pt-5">
              <label htmlFor="rejection-reason" className="block text-form-label font-medium">
                Rejection reason
              </label>
              <textarea
                id="rejection-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={20}
                maxLength={1000}
                rows={4}
                aria-describedby="rejection-reason-help"
                className="w-full rounded-md border border-border bg-surface p-3 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p id="rejection-reason-help" className="text-supporting text-text-secondary">
                Required for rejection; 20–1000 characters.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setConfirmationAction('approve')} disabled={isMutating}>
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmationAction('reject')}
                  disabled={isMutating || reason.trim().length < 20 || reason.trim().length > 1000}
                >
                  Reject
                </Button>
              </div>
            </section>
          )}
        </div>
      </Dialog>

      <ConfirmationDialog
        open={confirmationAction !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setConfirmationAction(null)
        }}
        title={confirmationAction === 'approve' ? 'Approve application?' : 'Reject application?'}
        description={
          confirmationAction === 'approve'
            ? 'This approves the application, adds the seller role, and creates the initial storefront.'
            : 'This rejects the application and records the reason above.'
        }
        confirmLabel={
          confirmationAction === 'approve' ? 'Approve application' : 'Reject application'
        }
        tone={confirmationAction === 'reject' ? 'danger' : 'primary'}
        isConfirming={isMutating}
        onConfirm={confirmAction}
      />
    </>
  )
}
