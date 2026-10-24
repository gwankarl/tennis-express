import { PageHeading } from '../../components/layout/PageHeading'
import { EmptyState } from '../../components/feedback/EmptyState'

interface UserSectionPageProps {
  title: string
}

/** Shows a temporary empty state for a user section awaiting its feature. */
export default function UserSectionPage({ title }: UserSectionPageProps) {
  return (
    <div className="space-y-6">
      <PageHeading title={title} />
      <EmptyState
        title={`${title} is coming soon`}
        description="This section is not available yet."
      />
    </div>
  )
}
