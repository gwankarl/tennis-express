import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Notification } from '../../../../../components/feedback/Notification'
import { Button } from '../../../../../components/ui/Button'
import { FormField } from '../../../../../components/ui/FormField'
import { getApiError } from '../../../../../lib/apiError'
import type {
  CreateSellerProductVariantRequest,
  ProductOptionDefinition,
  SellerProductVariant,
} from '../../types'
import {
  createSellerProductVariantFormSchema,
  type SellerProductVariantFormValues,
} from '../schemas/sellerProductVariantForm.schema'

interface SellerProductVariantFormProps {
  options: ProductOptionDefinition[]
  variant?: SellerProductVariant
  isSaving: boolean
  onCancel: () => void
  onSave: (input: CreateSellerProductVariantRequest) => Promise<void>
}

/** Collects or edits the details and option selections for one variant. */
export function SellerProductVariantForm({
  options,
  variant,
  isSaving,
  onCancel,
  onSave,
}: SellerProductVariantFormProps) {
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const isEditing = Boolean(variant)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SellerProductVariantFormValues>({
    resolver: zodResolver(createSellerProductVariantFormSchema(options)),
    defaultValues: {
      name: variant?.name ?? '',
      sku: variant?.sku ?? '',
      price: variant?.price ?? 1,
      stockQuantity: variant?.stockQuantity ?? 0,
      optionValues: options.map((option) => variant?.attributes?.[option.name] ?? ''),
    },
  })

  const submitForm = async (values: SellerProductVariantFormValues) => {
    setSaveError(null)
    setSaveSuccess(null)

    const attributes = Object.fromEntries(
      options.map((option, index) => [option.name, values.optionValues[index]]),
    )

    const input: CreateSellerProductVariantRequest = {
      name: values.name.trim(),
      sku: values.sku.trim() || null,
      price: values.price,
      stockQuantity: values.stockQuantity,
      ...(options.length > 0 ? { attributes } : {}),
    }

    try {
      await onSave(input)

      if (!isEditing) {
        reset({
          name: '',
          sku: '',
          price: 1,
          stockQuantity: 0,
          optionValues: options.map(() => ''),
        })
      }

      setSaveSuccess(isEditing ? 'Variant updated.' : 'Variant created.')
    } catch (error) {
      setSaveError(getApiError(error).message)
    }
  }

  return (
    <form
      noValidate
      aria-busy={isSaving}
      onSubmit={handleSubmit(submitForm)}
      className="space-y-4 rounded-xl border border-border bg-surface p-4"
    >
      <h3 className="text-card-heading font-semibold text-text-primary">
        {isEditing ? 'Edit variant' : 'Add variant'}
      </h3>

      {saveError && (
        <Notification
          title={isEditing ? 'Variant could not be updated' : 'Variant could not be created'}
          message={saveError}
          tone="error"
          onDismiss={() => setSaveError(null)}
        />
      )}

      {saveSuccess && (
        <Notification
          title={isEditing ? 'Variant updated' : 'Variant created'}
          message={saveSuccess}
          tone="success"
          onDismiss={() => setSaveSuccess(null)}
        />
      )}

      <FormField
        id="variant-name"
        label="Variant name"
        placeholder="For example, Size 7"
        error={errors.name?.message}
        {...register('name')}
      />

      {options.map((option, index) => (
        <label
          key={option.name}
          htmlFor={`variant-option-${index}`}
          className="grid gap-1.5 text-form-label font-medium text-text-secondary"
        >
          {option.name}
          <select
            id={`variant-option-${index}`}
            className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-invalid={Boolean(errors.optionValues?.[index])}
            {...register(`optionValues.${index}`)}
          >
            <option value="">Choose {option.name.toLowerCase()}</option>
            {option.values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {errors.optionValues?.[index]?.message && (
            <span className="text-supporting text-error" role="alert">
              {errors.optionValues[index]?.message}
            </span>
          )}
        </label>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="variant-price"
          label="Price"
          type="number"
          min={1}
          step={1}
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />

        <FormField
          id="variant-stock"
          label="Stock quantity"
          type="number"
          min={0}
          step={1}
          error={errors.stockQuantity?.message}
          {...register('stockQuantity', { valueAsNumber: true })}
        />
      </div>

      <FormField
        id="variant-sku"
        label="SKU (optional)"
        placeholder="Enter a unique SKU, if you use one"
        error={errors.sku?.message}
        {...register('sku')}
      />

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save changes'
              : 'Create variant'}
        </Button>
      </div>
    </form>
  )
}
