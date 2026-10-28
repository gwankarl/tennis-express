import { Link, useNavigate, useParams } from 'react-router'

import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { AdminPromotionForm } from '../../features/admin/promotions/components/AdminPromotionForm'
import {
  useAdminPromotion,
  useCreateAdminMarketplaceCampaign,
  useUpdateAdminMarketplaceCampaign,
} from '../../features/admin/promotions/hooks/useAdminPromotions'
import type { AdminPromotionDetails } from '../../features/admin/promotions/types'
import type { AdminPromotionFormValues } from '../../features/admin/promotions/schemas/adminPromotionForm.schema'
import { getApiError } from '../../lib/apiError'

function toLocalDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function toFormValues(promotion: AdminPromotionDetails): AdminPromotionFormValues {
  return {
    name: promotion.name,
    eligibleProductIds: promotion.eligibleProductIds,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    startsAt: toLocalDateTime(promotion.startsAt),
    endsAt: toLocalDateTime(promotion.endsAt),
  }
}

/** Creates a marketplace campaign or edits an eligible existing campaign. */
export default function AdminPromotionFormPage() {
  const { promotionId } = useParams()
  const isEditMode = Boolean(promotionId)
  const navigate = useNavigate()

  const promotionQuery = useAdminPromotion(promotionId ?? null)
  const createMutation = useCreateAdminMarketplaceCampaign()
  const updateMutation = useUpdateAdminMarketplaceCampaign(promotionId ?? '')

  if (isEditMode && promotionQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeading title="Edit campaign" />
        <LoadingState label="Loading campaign…" />
      </div>
    )
  }

  if (isEditMode && (promotionQuery.isError || !promotionQuery.data)) {
    return (
      <div className="space-y-6">
        <PageHeading title="Edit campaign" />
        <ErrorState
          title="Campaign could not be loaded"
          description={
            promotionQuery.isError
              ? getApiError(promotionQuery.error).message
              : 'The campaign could not be found.'
          }
          onRetry={() => void promotionQuery.refetch()}
        />
        <Link
          to="/admin/promotions"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to promotions
        </Link>
      </div>
    )
  }

  const promotion = promotionQuery.data

  if (isEditMode && promotion && promotion.type !== 'marketplace_campaign') {
    return (
      <div className="space-y-6">
        <PageHeading title="Campaign cannot be edited" />
        <ErrorState description="Only marketplace campaigns can be edited here." />
        <Link
          to={`/admin/promotions/${encodeURIComponent(promotion._id)}`}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View promotion
        </Link>
      </div>
    )
  }

  if (isEditMode && promotion && promotion.status !== 'draft' && promotion.status !== 'scheduled') {
    return (
      <div className="space-y-6">
        <PageHeading title="Campaign cannot be edited" />
        <ErrorState description="Only draft or scheduled campaigns can be edited." />
        <Link
          to={`/admin/promotions/${encodeURIComponent(promotion._id)}`}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-body font-medium text-text-primary hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View campaign
        </Link>
      </div>
    )
  }

  const initialValues: AdminPromotionFormValues = promotion
    ? toFormValues(promotion)
    : {
        name: '',
        eligibleProductIds: [],
        discountType: 'percentage',
        discountValue: 1,
        startsAt: '',
        endsAt: '',
      }

  async function save(values: AdminPromotionFormValues) {
    const input = {
      ...values,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
    }

    if (isEditMode && promotionId) {
      await updateMutation.mutateAsync(input)
      navigate(`/admin/promotions/${encodeURIComponent(promotionId)}`)
      return
    }

    const createdPromotion = await createMutation.mutateAsync(input)
    navigate(`/admin/promotions/${encodeURIComponent(createdPromotion._id)}`)
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={isEditMode ? 'Edit marketplace campaign' : 'Create marketplace campaign'}
        description={
          isEditMode
            ? 'Update this draft or scheduled marketplace campaign.'
            : 'Select eligible products, set a discount, and schedule a marketplace campaign.'
        }
      />

      <AdminPromotionForm
        mode={isEditMode ? 'edit' : 'create'}
        initialValues={initialValues}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onCancel={() =>
          navigate(
            promotion
              ? `/admin/promotions/${encodeURIComponent(promotion._id)}`
              : '/admin/promotions',
          )
        }
        onSave={save}
      />
    </div>
  )
}
