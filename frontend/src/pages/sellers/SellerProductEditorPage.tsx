import { useNavigate, useParams, useSearchParams } from 'react-router'

import { ErrorState } from '../../components/feedback/ErrorState'
import { PageHeading } from '../../components/layout/PageHeading'
import { Button } from '../../components/ui/Button'
import { Notification } from '../../components/feedback/Notification'
import { LoadingState } from '../../components/feedback/LoadingState'
import { useSellerProductVariantSummary } from '../../features/sellers/products/variants/hooks/useSellerProductVariants'
import {
  SellerProductEditorNavigation,
  type ProductEditorSection,
} from '../../features/sellers/products/components/SellerProductEditorNavigation'
import type { SellerProductModerationEvent } from '../../features/sellers/products/types'
import { getProductEditorReadiness } from '../../features/sellers/products/utils/productEditorReadiness'
import { SellerProductDetailsForm } from '../../features/sellers/products/components/SellerProductDetailsForm'
import { SellerProductVariantsSection } from '../../features/sellers/products/variants/components/SellerProductVariantsSection'
import { SellerProductImagesSection } from '../../features/sellers/products/images/components/SellerProductImagesSection'
import {
  useCreateSellerProductDraft,
  useSellerProduct,
  useSellerProductBrands,
  useSellerProductCategories,
  useSellerProductVariantCount,
  useSubmitSellerProduct,
  useUpdateSellerProduct,
} from '../../features/sellers/products/hooks/useSellerProducts'
import { getApiError } from '../../lib/apiError'

function ProductModerationHistory({ events }: { events: SellerProductModerationEvent[] }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-card-heading font-semibold text-text-primary">Moderation history</h2>

      {events.length === 0 ? (
        <p className="text-supporting text-text-secondary">
          No moderation history has been recorded.
        </p>
      ) : (
        <ol className="space-y-3">
          {events.map((event, index) => {
            const date = new Date(event.createdAt)
            const formattedDate = Number.isNaN(date.getTime())
              ? 'Date unavailable'
              : date.toLocaleString()

            return (
              <li
                key={`${event.action}-${event.createdAt}-${index}`}
                className="rounded-lg border border-border p-4"
              >
                <p className="font-medium capitalize text-text-primary">
                  {event.action.replaceAll('_', ' ')}
                </p>
                <p className="mt-1 text-supporting text-text-secondary">{formattedDate}</p>
                {event.reason && (
                  <p className="mt-2 whitespace-pre-wrap text-supporting text-text-secondary">
                    {event.reason}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

/** Creates a product draft or edits an eligible existing draft. */
export default function SellerProductEditorPage() {
  const { productId } = useParams()
  const isCreateMode = productId === undefined

  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSection = searchParams.get('section')

  const currentSection: ProductEditorSection =
    requestedSection === 'variants' ||
    requestedSection === 'images' ||
    requestedSection === 'review'
      ? requestedSection
      : 'details'

  const handleSectionChange = (section: ProductEditorSection) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)

      if (section === 'details') {
        nextParams.delete('section')
      } else {
        nextParams.set('section', section)
      }

      return nextParams
    })
  }

  const productQuery = useSellerProduct(productId ?? '')
  const categoriesQuery = useSellerProductCategories()
  const brandsQuery = useSellerProductBrands()
  const variantCountQuery = useSellerProductVariantCount(productId ?? '')
  const createMutation = useCreateSellerProductDraft()
  const updateMutation = useUpdateSellerProduct(productId ?? '')
  const variantSummaryQuery = useSellerProductVariantSummary(productId ?? '', !isCreateMode)
  const submitMutation = useSubmitSellerProduct(productId ?? '')

  if (!isCreateMode && productQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeading title="Edit Product" />
        <LoadingState label="Loading product…" />
      </div>
    )
  }

  if (!isCreateMode && productQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Edit Product" />
        <ErrorState
          description={getApiError(productQuery.error).message}
          onRetry={() => void productQuery.refetch()}
        />
      </div>
    )
  }

  const product = isCreateMode ? null : (productQuery.data ?? null)

  if (!isCreateMode && !product) {
    return (
      <div className="space-y-6">
        <PageHeading title="Edit Product" />
        <ErrorState
          description="The product could not be loaded."
          onRetry={() => void productQuery.refetch()}
        />
      </div>
    )
  }

  const isEditableDraft =
    product?.publicationStatus === 'draft' &&
    (product.moderationStatus === 'not_submitted' ||
      product.moderationStatus === 'changes_requested')

  if (!isCreateMode && product?.moderationStatus === 'pending' && product.submittedAt) {
    return (
      <div className="space-y-6">
        <PageHeading title="Product submitted" />
        <Notification
          tone="success"
          title="Sent for review"
          message="Your product has been submitted to the admin team for moderation."
        />
        <ProductModerationHistory events={product.moderationHistory ?? []} />
        <Button type="button" variant="outline" onClick={() => navigate('/seller/products')}>
          Back to products
        </Button>
      </div>
    )
  }

  if (!isCreateMode && product && !isEditableDraft) {
    return (
      <div className="space-y-6">
        <PageHeading title="Edit Product" />
        <section className="space-y-4">
          <p className="text-body text-text-secondary">
            Only drafts that have not been submitted or have changes requested can be edited here.
          </p>
          {product.moderationStatus === 'rejected' && product.moderationReason && (
            <Notification
              tone="error"
              title="Product rejected"
              message={product.moderationReason}
            />
          )}

          <ProductModerationHistory events={product.moderationHistory ?? []} />
          <Button type="button" variant="outline" onClick={() => navigate('/seller/products')}>
            Back to products
          </Button>
        </section>
      </div>
    )
  }

  if (categoriesQuery.isPending || brandsQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeading title={isCreateMode ? 'Add Product' : 'Edit Product'} />
        <LoadingState label="Loading product categories and brands…" />
      </div>
    )
  }

  if (categoriesQuery.isError || brandsQuery.isError) {
    const error = categoriesQuery.isError ? categoriesQuery.error : brandsQuery.error

    return (
      <div className="space-y-6">
        <PageHeading title={isCreateMode ? 'Add Product' : 'Edit Product'} />
        <ErrorState
          description={getApiError(error).message}
          onRetry={() => {
            void Promise.all([categoriesQuery.refetch(), brandsQuery.refetch()])
          }}
        />
      </div>
    )
  }

  const sectionReadiness = getProductEditorReadiness({
    product,
    categories: categoriesQuery.data.categories,
    brands: brandsQuery.data.brands,
    variantCount: isCreateMode ? 0 : variantCountQuery.data,
    activeVariantCount: isCreateMode ? 0 : variantSummaryQuery.data?.activeCount,
  })

  return (
    <div className="space-y-6">
      <PageHeading
        title={isCreateMode ? 'Add Product' : 'Edit Product'}
        description={
          isCreateMode
            ? 'Enter product details now, or save an empty draft and continue later.'
            : 'Update this draft before submitting it for review.'
        }
      />

      {product?.moderationStatus === 'changes_requested' && (
        <Notification
          tone="warning"
          title="Changes requested"
          message={[
            product.moderationReason ?? 'The admin team requested changes to this product.',
            product.reviewedAt
              ? `Reviewed ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                  new Date(product.reviewedAt),
                )}.`
              : null,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}

      {product && <ProductModerationHistory events={product.moderationHistory ?? []} />}

      <SellerProductEditorNavigation
        currentSection={currentSection}
        readiness={sectionReadiness}
        onSectionChange={handleSectionChange}
      />

      <div hidden={currentSection !== 'details'}>
        <SellerProductDetailsForm
          mode={isCreateMode ? 'create' : 'edit'}
          product={product}
          categories={categoriesQuery.data.categories}
          brands={brandsQuery.data.brands}
          hasVariants={
            isCreateMode
              ? false
              : variantCountQuery.data === undefined
                ? null
                : variantCountQuery.data > 0
          }
          isCheckingVariants={!isCreateMode && variantCountQuery.isPending}
          variantCheckError={
            !isCreateMode && variantCountQuery.isError
              ? getApiError(variantCountQuery.error).message
              : null
          }
          onRetryVariantCheck={() => void variantCountQuery.refetch()}
          isSaving={isCreateMode ? createMutation.isPending : updateMutation.isPending}
          onCancel={() => navigate('/seller/products')}
          onSave={async (changes) => {
            const savedProduct = isCreateMode
              ? await createMutation.mutateAsync(changes)
              : await updateMutation.mutateAsync(changes)

            navigate(`/seller/products/${savedProduct._id}?section=variants`, {
              replace: true,
            })
          }}
        />
      </div>

      <div hidden={currentSection !== 'variants'}>
        {!isCreateMode && product ? (
          <SellerProductVariantsSection productId={product._id} options={product.options} />
        ) : (
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-card-heading font-semibold text-text-primary">Product variants</h2>
            <p className="mt-2 text-supporting text-text-secondary">
              Save the product draft before adding variants.
            </p>
          </section>
        )}
      </div>

      <div hidden={currentSection !== 'images'}>
        {!isCreateMode && product ? (
          <SellerProductImagesSection productId={product._id} productName={product.name} />
        ) : (
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-card-heading font-semibold text-text-primary">Product images</h2>
            <p className="mt-2 text-supporting text-text-secondary">
              Save the product draft before uploading images.
            </p>
          </section>
        )}
      </div>

      <div hidden={currentSection !== 'review'}>
        {isCreateMode || !product ? (
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-card-heading font-semibold text-text-primary">
              Review &amp; Submit
            </h2>
            <p className="mt-2 text-supporting text-text-secondary">
              Save the product draft before reviewing it for submission.
            </p>
          </section>
        ) : (
          <section className="space-y-5 rounded-xl border border-border bg-surface p-5">
            <div>
              <h2 className="text-section-heading font-semibold text-text-primary">
                Review &amp; Submit
              </h2>
              <p className="mt-1 text-supporting text-text-secondary">
                Check the saved details before sending this product to the admin team for
                moderation.
              </p>
            </div>

            {variantSummaryQuery.isPending && <LoadingState label="Checking product variants…" />}

            {variantSummaryQuery.isError && (
              <Notification
                tone="error"
                title="Could not check variants"
                message={getApiError(variantSummaryQuery.error).message}
              />
            )}

            {submitMutation.isError && (
              <Notification
                tone="error"
                title="Product was not submitted"
                message={getApiError(submitMutation.error).message}
              />
            )}

            <ul className="space-y-3">
              {(
                [
                  ['details', 'Product details'],
                  ['images', 'Product images'],
                  ['variants', 'At least one active variant'],
                ] as const
              ).map(([section, label]) => {
                const isComplete = sectionReadiness[section] === 'complete'

                return (
                  <li
                    key={section}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-text-primary">{label}</p>
                      <p className="text-supporting text-text-secondary">
                        {isComplete ? 'Ready' : 'Needs attention'}
                      </p>
                    </div>

                    {!isComplete && (
                      <Button
                        type="button"
                        variant="outline"
                        size="small"
                        onClick={() => handleSectionChange(section)}
                      >
                        Review
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>

            <p className="text-supporting text-text-secondary">
              The server performs the final checks, including seller eligibility and all variant
              details, when you submit.
            </p>

            <Button
              type="button"
              disabled={
                sectionReadiness.review !== 'ready' ||
                variantSummaryQuery.isPending ||
                variantSummaryQuery.isError ||
                submitMutation.isPending
              }
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? 'Submitting…' : 'Submit for review'}
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}
