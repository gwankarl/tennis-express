import { useState } from 'react'

import { ErrorState } from '../../../../../components/feedback/ErrorState'
import { LoadingState } from '../../../../../components/feedback/LoadingState'
import { Notification } from '../../../../../components/feedback/Notification'
import { Button } from '../../../../../components/ui/Button'
import { Dialog } from '../../../../../components/ui/Dialog'
import { getApiError } from '../../../../../lib/apiError'
import type { ProductOptionDefinition, SellerProductVariant } from '../../types'
import {
  useCreateSellerProductVariant,
  useSellerProductVariants,
  useUpdateSellerProductVariant,
  useUpdateSellerProductVariantStatus,
} from '../hooks/useSellerProductVariants'
import { SellerProductVariantForm } from './SellerProductVariantForm'
import { SellerProductVariantList } from './SellerProductVariantList'

const VARIANTS_PER_PAGE = 10

interface SellerProductVariantsSectionProps {
  productId: string
  options: ProductOptionDefinition[]
}

/** Loads, creates, edits, and changes the availability of product variants. */
export function SellerProductVariantsSection({
  productId,
  options,
}: SellerProductVariantsSectionProps) {
  const [page, setPage] = useState(1)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<SellerProductVariant | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [variantToChangeStatus, setVariantToChangeStatus] = useState<SellerProductVariant | null>(
    null,
  )

  const variantsQuery = useSellerProductVariants(productId, {
    page,
    limit: VARIANTS_PER_PAGE,
  })
  const createMutation = useCreateSellerProductVariant(productId)
  const updateMutation = useUpdateSellerProductVariant(productId)
  const statusMutation = useUpdateSellerProductVariantStatus(productId)

  const handleConfirmStatusChange = async () => {
    if (!variantToChangeStatus) return

    const variant = variantToChangeStatus
    const nextStatus = variant.status === 'active' ? 'inactive' : 'active'

    setActionError(null)
    setActionMessage(null)

    try {
      await statusMutation.mutateAsync({
        variantId: variant._id,
        input: { status: nextStatus },
      })

      setActionMessage(`Variant "${variant.name}" is now ${nextStatus}.`)
      setVariantToChangeStatus(null)
    } catch (error) {
      setActionError(getApiError(error).message)
      setVariantToChangeStatus(null)
    }
  }

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-section-heading font-semibold text-text-primary">Product variants</h2>
          <p className="mt-1 text-supporting text-text-secondary">
            Manage the available configurations, prices, and stock for this product.
          </p>
        </div>

        {!isCreateFormOpen && !editingVariant && (
          <Button
            type="button"
            onClick={() => {
              setActionError(null)
              setActionMessage(null)
              setIsCreateFormOpen(true)
            }}
          >
            Add variant
          </Button>
        )}
      </div>

      {actionError && (
        <Notification
          title="Variant action failed"
          message={actionError}
          tone="error"
          onDismiss={() => setActionError(null)}
        />
      )}

      {actionMessage && (
        <Notification
          title="Variant status updated"
          message={actionMessage}
          tone="success"
          onDismiss={() => setActionMessage(null)}
        />
      )}

      {isCreateFormOpen && (
        <SellerProductVariantForm
          options={options}
          isSaving={createMutation.isPending}
          onCancel={() => setIsCreateFormOpen(false)}
          onSave={async (input) => {
            await createMutation.mutateAsync(input)
          }}
        />
      )}

      {editingVariant && (
        <SellerProductVariantForm
          key={editingVariant._id}
          options={options}
          variant={editingVariant}
          isSaving={updateMutation.isPending}
          onCancel={() => setEditingVariant(null)}
          onSave={async (changes) => {
            await updateMutation.mutateAsync({
              variantId: editingVariant._id,
              changes,
            })
          }}
        />
      )}

      {variantsQuery.isPending && <LoadingState label="Loading variants..." />}

      {variantsQuery.isError && (
        <ErrorState
          description={getApiError(variantsQuery.error).message}
          onRetry={() => void variantsQuery.refetch()}
        />
      )}

      {variantsQuery.data && (
        <SellerProductVariantList
          variants={variantsQuery.data.variants}
          pagination={variantsQuery.data.pagination}
          isUpdatingStatus={statusMutation.isPending}
          onPageChange={setPage}
          onEdit={(variant) => {
            setActionError(null)
            setActionMessage(null)
            setIsCreateFormOpen(false)
            setEditingVariant(variant)
          }}
          onToggleStatus={(variant) => setVariantToChangeStatus(variant)}
        />
      )}

      <Dialog
        open={variantToChangeStatus !== null}
        onOpenChange={(open) => {
          if (!statusMutation.isPending && !open) {
            setVariantToChangeStatus(null)
          }
        }}
        title={
          variantToChangeStatus?.status === 'active' ? 'Deactivate variant?' : 'Activate variant?'
        }
        description={
          variantToChangeStatus
            ? `Are you sure you want to ${
                variantToChangeStatus.status === 'active' ? 'deactivate' : 'activate'
              } "${variantToChangeStatus.name}"?`
            : undefined
        }
      >
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={statusMutation.isPending}
            onClick={() => setVariantToChangeStatus(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={variantToChangeStatus?.status === 'active' ? 'danger' : 'primary'}
            disabled={statusMutation.isPending}
            onClick={() => void handleConfirmStatusChange()}
          >
            {statusMutation.isPending
              ? 'Updating...'
              : variantToChangeStatus?.status === 'active'
                ? 'Deactivate variant'
                : 'Activate variant'}
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
