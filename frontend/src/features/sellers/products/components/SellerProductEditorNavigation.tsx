export type ProductEditorSection = 'details' | 'variants' | 'images' | 'review'

export type ProductEditorSectionStatus = 'complete' | 'incomplete' | 'checking' | 'ready'

interface SellerProductEditorNavigationProps {
  currentSection: ProductEditorSection
  readiness: Record<ProductEditorSection, ProductEditorSectionStatus>
  onSectionChange: (section: ProductEditorSection) => void
}

const sections: Array<{ id: ProductEditorSection; label: string }> = [
  { id: 'details', label: 'Product Details' },
  { id: 'variants', label: 'Variants' },
  { id: 'images', label: 'Images' },
  { id: 'review', label: 'Review & Submit' },
]

const statusLabels: Record<ProductEditorSectionStatus, string> = {
  complete: 'Complete',
  incomplete: 'Incomplete',
  checking: 'Checking',
  ready: 'Ready to review',
}

/** Provides responsive section navigation and saved-data progress indicators. */
export function SellerProductEditorNavigation({
  currentSection,
  readiness,
  onSectionChange,
}: SellerProductEditorNavigationProps) {
  const completedCount = Object.values(readiness).filter((status) => status === 'complete').length

  return (
    <div className="space-y-3">
      <section
        aria-label="Product listing progress"
        className="space-y-2 rounded-xl border border-border bg-surface p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-text-primary">{completedCount} of 4 sections complete</p>
          <p className="text-supporting text-text-secondary">Based on saved product data</p>
        </div>

        <div
          role="progressbar"
          aria-label="Product listing completion"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={completedCount}
          className="h-2 overflow-hidden rounded-full bg-page"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${(completedCount / 4) * 100}%` }}
          />
        </div>

        <p className="text-supporting text-text-secondary">
          These checks are preliminary. The server verifies seller eligibility and all submission
          requirements when you submit for review.
        </p>
      </section>

      <nav aria-label="Product editor sections">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sections.map((section, index) => {
            const isCurrent = currentSection === section.id

            return (
              <li key={section.id}>
                <button
                  type="button"
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => onSectionChange(section.id)}
                  className={[
                    'flex min-h-16 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-supporting font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    isCurrent
                      ? 'border-primary bg-secondary text-primary'
                      : 'border-border bg-surface text-text-secondary hover:bg-page hover:text-text-primary',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-supporting',
                      isCurrent ? 'bg-primary text-surface' : 'bg-page text-text-secondary',
                    ].join(' ')}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block">{section.label}</span>
                    <span className="block text-supporting font-normal">
                      {isCurrent ? 'Current · ' : ''}
                      {statusLabels[readiness[section.id]]}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
