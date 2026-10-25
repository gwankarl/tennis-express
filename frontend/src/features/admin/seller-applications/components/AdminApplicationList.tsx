import { Button } from '../../../../components/ui/Button'
import { StatusLabel, type StatusTone } from '../../../../components/ui/StatusLabel'
import type { AdminApplicationListRecord } from '../types'

interface AdminApplicationListProps {
  applications: AdminApplicationListRecord[]
  onOpen: (applicationId: string) => void
}

const statusTone: Record<AdminApplicationListRecord['application']['status'], StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

/** Displays responsive application summary cards for an admin status queue. */
export function AdminApplicationList({ applications, onOpen }: AdminApplicationListProps) {
  return (
    <ul className="grid gap-4">
      {applications.map(({ application, applicant }) => {
        const business = application.applicationData.businessDetails

        return (
          <li key={application._id}>
            <article className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-card-heading font-semibold text-text-primary">
                    {business.storeName || business.businessName || 'Seller application'}
                  </h2>
                  <StatusLabel tone={statusTone[application.status]}>
                    {application.status}
                  </StatusLabel>
                </div>

                <p className="mt-2 wrap-break-word text-supporting text-text-secondary">
                  {applicant
                    ? `${applicant.userName} · ${applicant.email}`
                    : 'Applicant account is unavailable'}
                </p>
                <p className="mt-1 text-supporting text-text-secondary">
                  {application.applicationData.contactDetails.city},{' '}
                  {application.applicationData.contactDetails.region}
                  {' · Submitted '}
                  {new Date(application.submittedAt).toLocaleString()}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => onOpen(application._id)}
                className="w-full sm:w-auto"
              >
                Review application
              </Button>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
