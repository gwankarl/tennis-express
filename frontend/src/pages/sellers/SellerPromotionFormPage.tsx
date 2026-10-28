import { Link, useNavigate, useParams } from 'react-router'

import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { SellerPromotionForm } from '../../features/sellers/promotions/components/SellerPromotionForm'
import {
  useCreateSellerPromotion,
  useSellerPromotion,
  useUpdateSellerPromotion,
} from '../../features/sellers/promotions/hooks/useSellerPromotions'
import type { SellerPromotionFormValues } from '../../features/sellers/promotions/schemas/sellerPromotionForm.schema'
import type {
  CreateSellerPromotionRequest,
  UpdateSellerPromotionRequest,
} from '../../features/sellers/promotions/types'
import { getApiError } from '../../lib/apiError'

function toLocalDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function toFormValues(
  promotion: NonNullable<ReturnType<typeof useSellerPromotion>['data']>,
): SellerPromotionFormValues {
  return {
    name: promotion.name,
    eligibleProductIds: promotion.eligibleProductIds,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    startsAt: toLocalDateTime(promotion.startsAt),
    endsAt: toLocalDateTime(promotion.endsAt),
  }
}

function toApiDateTime(localValue: string): string {
  // toISOString emits UTC with a Z offset, which satisfies the backend offset requirement.
  return new Date(localValue).toISOString()
}

/** Creates a promotion or edits an existing draft or scheduled promotion. */
export default function SellerPromotionFormPage() {
  const { promotionId } = useParams()
  const isEditMode = Boolean(promotionId)
  const navigate = useNavigate()

  const promotionQuery = useSellerPromotion(promotionId ?? '')
  const createMutation = useCreateSellerPromotion()
  const updateMutation = useUpdateSellerPromotion(promotionId ?? '')

  if (isEditMode && promotionQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeading title="Edit promotion" />
        <LoadingState label="Loading promotion…" />
      </div>
    )
  }

  if (isEditMode && (promotionQuery.isError || !promotionQuery.data)) {
    return (
      <div className="space-y-6">
        <PageHeading title="Edit promotion" />
        <ErrorState
          title="Promotion could not be loaded"
          description={
            promotionQuery.isError
              ? getApiError(promotionQuery.error).message
              : 'The promotion could not be found.'
          }
          onRetry={() => void promotionQuery.refetch()}
        />
        <Link
          to="/seller/promotions"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to promotions
        </Link>
      </div>
    )
  }

  const promotion = promotionQuery.data

  if (isEditMode && promotion && promotion.status !== 'draft' && promotion.status !== 'scheduled') {
    return (
      <div className="space-y-6">
        <PageHeading title="Promotion cannot be edited" />
        <ErrorState description="Only draft and scheduled promotions can be edited." />
        <Link
          to={`/seller/promotions/${encodeURIComponent(promotion._id)}`}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View promotion
        </Link>
      </div>
    )
  }

  const initialValues: SellerPromotionFormValues = promotion
    ? toFormValues(promotion)
    : {
        name: '',
        eligibleProductIds: [],
        discountType: 'percentage',
        discountValue: 1,
        startsAt: '',
        endsAt: '',
      }

  async function save(values: SellerPromotionFormValues) {
    const dateFields = {
      startsAt: toApiDateTime(values.startsAt),
      endsAt: toApiDateTime(values.endsAt),
    }

    if (isEditMode) {
      const changes: UpdateSellerPromotionRequest = {
        ...values,
        ...dateFields,
      }
      const updatedPromotion = await updateMutation.mutateAsync(changes)
      navigate(`/seller/promotions/${encodeURIComponent(updatedPromotion._id)}`)
      return
    }

    const input: CreateSellerPromotionRequest = {
      ...values,
      ...dateFields,
    }
    const createdPromotion = await createMutation.mutateAsync(input)
    navigate(`/seller/promotions/${encodeURIComponent(createdPromotion._id)}`)
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={isEditMode ? 'Edit promotion' : 'Create promotion'}
        description={
          isEditMode
            ? 'Update the details of this draft or scheduled promotion.'
            : 'Choose eligible products, set a discount, and schedule your promotion.'
        }
      />

      <SellerPromotionForm
        mode={isEditMode ? 'edit' : 'create'}
        initialValues={initialValues}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onCancel={() =>
          navigate(
            promotion
              ? `/seller/promotions/${encodeURIComponent(promotion._id)}`
              : '/seller/promotions',
          )
        }
        onSave={save}
      />
    </div>
  )
}
