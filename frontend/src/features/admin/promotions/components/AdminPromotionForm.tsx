import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { Notification } from '../../../../components/feedback/Notification'
import { Button } from '../../../../components/ui/Button'
import { FormField } from '../../../../components/ui/FormField'
import { Label } from '../../../../components/ui/Label'
import { ValidationMessage } from '../../../../components/ui/ValidationMessage'
import { getApiError } from '../../../../lib/apiError'
import {
  adminPromotionFormSchema,
  type AdminPromotionFormValues,
} from '../schemas/adminPromotionForm.schema'
import { AdminEligibleProductPicker } from './AdminEligibleProductPicker'

interface AdminPromotionFormProps {
  mode: 'create' | 'edit'
  initialValues: AdminPromotionFormValues
  isSaving: boolean
  onCancel: () => void
  onSave: (values: AdminPromotionFormValues) => Promise<void>
}

const selectClasses =
  'min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

/** Form for creating or editing an administrator marketplace campaign. */
export function AdminPromotionForm({
  mode,
  initialValues,
  isSaving,
  onCancel,
  onSave,
}: AdminPromotionFormProps) {
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminPromotionFormValues>({
    resolver: zodResolver(adminPromotionFormSchema),
    defaultValues: initialValues,
  })

  const selectedProductIds = useWatch({
    control,
    name: 'eligibleProductIds',
  })

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local timezone'

  async function submit(values: AdminPromotionFormValues) {
    setSaveError(null)

    try {
      await onSave(values)
    } catch (error) {
      setSaveError(getApiError(error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      {saveError && (
        <Notification
          title="Campaign could not be saved"
          message={saveError}
          tone="error"
          onDismiss={() => setSaveError(null)}
        />
      )}

      <section className="grid gap-5 rounded-xl border border-border bg-surface p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-card-heading font-semibold text-text-primary">Campaign details</h2>
          {mode === 'edit' && (
            <p className="mt-1 text-supporting text-text-secondary">
              Only draft and scheduled marketplace campaigns can be edited.
            </p>
          )}
        </div>

        <FormField
          id="admin-promotion-name"
          label="Campaign name"
          required
          maxLength={120}
          placeholder="For example, Summer racket sale"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid gap-1.5">
          <Label htmlFor="admin-promotion-discount-type" required>
            Discount type
          </Label>
          <select
            id="admin-promotion-discount-type"
            className={selectClasses}
            aria-invalid={Boolean(errors.discountType)}
            aria-describedby={
              errors.discountType ? 'admin-promotion-discount-type-error' : undefined
            }
            {...register('discountType')}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed_amount">Fixed amount</option>
          </select>
          {errors.discountType?.message && (
            <ValidationMessage id="admin-promotion-discount-type-error">
              {errors.discountType.message}
            </ValidationMessage>
          )}
        </div>

        <FormField
          id="admin-promotion-discount-value"
          label="Discount value"
          type="number"
          required
          min={1}
          step={1}
          hint="Enter a whole number. Percentage discounts cannot exceed 90."
          error={errors.discountValue?.message}
          {...register('discountValue', { valueAsNumber: true })}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <AdminEligibleProductPicker
          selectedProductIds={selectedProductIds ?? []}
          onChange={(productIds) =>
            setValue('eligibleProductIds', productIds, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        />
        {errors.eligibleProductIds?.message && (
          <ValidationMessage>{errors.eligibleProductIds.message}</ValidationMessage>
        )}
      </section>

      <section className="grid gap-5 rounded-xl border border-border bg-surface p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-card-heading font-semibold text-text-primary">Schedule</h2>
          <p className="mt-1 text-supporting text-text-secondary">
            Times use {timeZone}. The end must be in the future and later than the start.
          </p>
        </div>

        <FormField
          id="admin-promotion-starts-at"
          label="Starts"
          type="datetime-local"
          required
          error={errors.startsAt?.message}
          {...register('startsAt')}
        />

        <FormField
          id="admin-promotion-ends-at"
          label="Ends"
          type="datetime-local"
          required
          error={errors.endsAt?.message}
          {...register('endsAt')}
        />
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : mode === 'create' ? 'Create campaign' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
