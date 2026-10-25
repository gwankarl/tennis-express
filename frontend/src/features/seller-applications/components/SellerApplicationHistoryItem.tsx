import { StatusLabel, type StatusTone } from '../../../components/ui/StatusLabel'
import type { SellerApplication } from '../types'

interface SellerApplicationHistoryItemProps {
  application: SellerApplication
  onResubmit: (application: SellerApplication) => void
}

const statusTone: Record<SellerApplication['status'], StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

/** Shows an application status and expandable submitted details. */
export function SellerApplicationHistoryItem({
  application,
  onResubmit,
}: SellerApplicationHistoryItemProps) {
  const { applicationData } = application

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-card-heading font-semibold text-text-primary">
            {applicationData.businessDetails.storeName ||
              applicationData.businessDetails.businessName ||
              'Seller application'}
          </h2>
          <p className="mt-1 text-supporting text-text-secondary">
            Submitted {new Date(application.submittedAt).toLocaleDateString()}
          </p>
        </div>

        <StatusLabel tone={statusTone[application.status]}>{application.status}</StatusLabel>
      </div>

      {application.status === 'rejected' && application.decisionReason && (
        <div className="mt-4 rounded-lg border border-error bg-error-background p-4">
          <h3 className="font-semibold text-error">Review feedback</h3>
          <p className="mt-1 text-supporting text-text-primary">{application.decisionReason}</p>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer font-medium text-primary">
          View application details
        </summary>

        <dl className="mt-4 grid gap-3 text-supporting sm:grid-cols-2">
          <div>
            <dt className="font-medium text-text-primary">Seller type</dt>
            <dd className="text-text-secondary">{applicationData.businessDetails.sellerType}</dd>
          </div>
          <div>
            <dt className="font-medium text-text-primary">Contact location</dt>
            <dd className="text-text-secondary">
              {applicationData.contactDetails.city}, {applicationData.contactDetails.region}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-text-primary">Phone</dt>
            <dd className="text-text-secondary">{applicationData.contactDetails.phoneNumber}</dd>
          </div>
          <div>
            <dt className="font-medium text-text-primary">Dispatch time</dt>
            <dd className="text-text-secondary">
              {applicationData.fulfilmentDetails.dispatchTime.replaceAll('_', ' ')}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-text-primary">Business description</dt>
            <dd className="whitespace-pre-wrap text-text-secondary">
              {applicationData.productDetails.businessDescription}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-text-primary">Supporting documents</dt>
            <dd className="text-text-secondary">
              {applicationData.supportingDocuments.length
                ? applicationData.supportingDocuments.map((document) => (
                    <a
                      key={document.publicId}
                      href={document.secureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-3 inline-block text-primary underline"
                    >
                      {document.fileName}
                    </a>
                  ))
                : 'No documents attached'}
            </dd>
          </div>
        </dl>
      </details>

      {application.status === 'rejected' && (
        <button
          type="button"
          onClick={() => onResubmit(application)}
          className="mt-4 min-h-11 rounded-md bg-primary px-4 py-2 font-medium text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Resubmit application
        </button>
      )}
    </article>
  )
}
