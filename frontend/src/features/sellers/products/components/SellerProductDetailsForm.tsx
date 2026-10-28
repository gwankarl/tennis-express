import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldPath,
} from 'react-hook-form'

import { Notification } from '../../../../components/feedback/Notification'
import { Button } from '../../../../components/ui/Button'
import { FormField } from '../../../../components/ui/FormField'
import { Input } from '../../../../components/ui/Input'
import { Label } from '../../../../components/ui/Label'
import { ValidationMessage } from '../../../../components/ui/ValidationMessage'
import { ConfirmationDialog } from '../../../../components/ui/ConfirmationDialog'
import { getApiError } from '../../../../lib/apiError'
import type {
  SellerProductBrand,
  SellerProductCategory,
  SellerProductCategoryAttribute,
  SellerProductDetails,
  SellerProductDraftRequest,
} from '../types'
import {
  productDetailsSchema,
  type ProductDetailsFormValues,
} from '../schemas/productDetails.schema'

interface SellerProductDetailsFormProps {
  mode?: 'create' | 'edit'
  product: SellerProductDetails | null
  categories: SellerProductCategory[]
  brands: SellerProductBrand[]
  hasVariants: boolean | null
  isCheckingVariants: boolean
  variantCheckError: string | null
  onRetryVariantCheck: () => void
  isSaving: boolean
  onCancel: () => void
  onSave: (changes: SellerProductDraftRequest) => Promise<void>
}

const selectClasses =
  'min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

/** Renders an input appropriate for one category-defined product attribute. */
function CategoryAttributeField({
  control,
  attribute,
}: {
  control: Control<ProductDetailsFormValues>
  attribute: SellerProductCategoryAttribute
}) {
  const fieldName = `attributes.${attribute.slug}` as FieldPath<ProductDetailsFormValues>
  const inputId = `attribute-${attribute.slug}`

  return (
    <Controller
      control={control}
      name={fieldName}
      render={({ field, fieldState }) => {
        const label = (
          <Label htmlFor={inputId}>
            {attribute.name}
            {attribute.required ? ' (required for review)' : ''}
          </Label>
        )

        if (attribute.type === 'boolean') {
          return (
            <div className="grid gap-1.5">
              {label}
              <select
                ref={field.ref}
                id={inputId}
                name={field.name}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const value = event.target.value
                  field.onChange(value === '' ? undefined : value === 'true')
                }}
                className={selectClasses}
                aria-invalid={Boolean(fieldState.error)}
              >
                <option value="">Choose yes or no</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              {fieldState.error?.message && (
                <ValidationMessage>{fieldState.error.message}</ValidationMessage>
              )}
            </div>
          )
        }

        if (attribute.type === 'select') {
          return (
            <div className="grid gap-1.5">
              {label}
              <select
                ref={field.ref}
                id={inputId}
                name={field.name}
                value={typeof field.value === 'string' ? field.value : ''}
                onBlur={field.onBlur}
                onChange={field.onChange}
                className={selectClasses}
                aria-invalid={Boolean(fieldState.error)}
              >
                <option value="">Choose an option</option>
                {attribute.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldState.error?.message && (
                <ValidationMessage>{fieldState.error.message}</ValidationMessage>
              )}
            </div>
          )
        }

        return (
          <div className="grid gap-1.5">
            {label}
            <Input
              ref={field.ref}
              id={inputId}
              name={field.name}
              type={attribute.type === 'number' ? 'number' : 'text'}
              step={attribute.type === 'number' ? 'any' : undefined}
              value={
                attribute.type === 'number'
                  ? typeof field.value === 'number'
                    ? String(field.value)
                    : ''
                  : typeof field.value === 'string'
                    ? field.value
                    : ''
              }
              onBlur={field.onBlur}
              onChange={(event) => {
                const value = event.target.value
                field.onChange(
                  attribute.type === 'number' ? (value === '' ? undefined : Number(value)) : value,
                )
              }}
              invalid={Boolean(fieldState.error)}
            />
            {fieldState.error?.message && (
              <ValidationMessage>{fieldState.error.message}</ValidationMessage>
            )}
          </div>
        )
      }}
    />
  )
}

function getInitialValues(product: SellerProductDetails | null): ProductDetailsFormValues {
  if (!product) {
    return {
      name: '',
      description: '',
      categoryId: '',
      brandId: '',
      condition: '',
      options: [],
      attributes: {},
    }
  }

  return {
    name: product.name ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId ?? '',
    brandId: product.brandId ?? '',
    condition: product.condition ?? '',
    options: product.options.map((option) => ({
      name: option.name,
      valuesText: option.values.join(', '),
    })),
    attributes: product.attributes ?? {},
  }
}

function toUpdateRequest(
  values: ProductDetailsFormValues,
  selectedCategory: SellerProductCategory | undefined,
  canEditOptions: boolean,
): SellerProductDraftRequest {
  const changes: SellerProductDraftRequest = {}

  if (values.name) changes.name = values.name
  if (values.description) changes.description = values.description
  if (values.categoryId) changes.categoryId = values.categoryId
  if (values.condition) changes.condition = values.condition

  // The backend accepts null to clear an optional brand.
  changes.brandId = values.brandId || null

  if (selectedCategory) {
    const attributes = Object.fromEntries(
      selectedCategory.attributes.flatMap((attribute) => {
        const value = values.attributes[attribute.slug]

        if (value === undefined || value === '') return []

        return [[attribute.slug, typeof value === 'string' ? value.trim() : value]]
      }),
    )

    changes.attributes = attributes
  }

  if (canEditOptions) {
    changes.options = values.options
      .map((option) => ({
        name: option.name.trim(),
        values: option.valuesText
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      }))
      .filter((option) => option.name.length > 0)
  }

  return changes
}

/** Edits product details while allowing incomplete drafts to be saved. */
export function SellerProductDetailsForm({
  mode = 'edit',
  product,
  categories,
  brands,
  hasVariants,
  isCheckingVariants,
  variantCheckError,
  onRetryVariantCheck,
  isSaving,
  onCancel,
  onSave,
}: SellerProductDetailsFormProps) {
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductDetailsFormValues>({
    resolver: zodResolver(productDetailsSchema),
    defaultValues: getInitialValues(product),
  })

  const optionFields = useFieldArray({ control, name: 'options' })
  const selectedCategoryId = useWatch({ control, name: 'categoryId' })
  const selectedCategory = categories.find((category) => category._id === selectedCategoryId)
  const canEditOptions = mode === 'create' || hasVariants === false
  const currentCategoryId = product?.categoryId
  const currentBrandId = product?.brandId
  const categoryRegistration = register('categoryId')

  const submitForm = async (values: ProductDetailsFormValues) => {
    setSaveError(null)
    setSaveSuccess(null)

    const changes = toUpdateRequest(values, selectedCategory, canEditOptions)

    try {
      await onSave(changes)
      reset(values)
      setSaveSuccess('Product details saved.')
    } catch (error) {
      const apiError = getApiError(error)
      setSaveError(apiError.message)

      for (const detail of apiError.details ?? []) {
        setError(detail.field as FieldPath<ProductDetailsFormValues>, {
          type: 'server',
          message: detail.message,
        })
      }
    }
  }

  return (
    <form noValidate aria-busy={isSaving} onSubmit={handleSubmit(submitForm)} className="space-y-6">
      {saveError && (
        <Notification
          title="Product details could not be saved"
          message={saveError}
          tone="error"
          onDismiss={() => setSaveError(null)}
        />
      )}

      {saveSuccess && (
        <Notification
          title="Changes saved"
          message={saveSuccess}
          tone="success"
          onDismiss={() => setSaveSuccess(null)}
        />
      )}

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <h2 className="text-section-heading font-semibold text-text-primary">Product details</h2>
          <p className="mt-1 text-supporting text-text-secondary">
            You can save an incomplete draft and finish it later.
          </p>
        </div>

        <FormField
          id="product-name"
          label="Product name"
          hint="Use a clear name customers can recognize."
          error={errors.name?.message}
          maxLength={150}
          {...register('name')}
        />

        <div className="grid gap-1.5">
          <Label htmlFor="product-description">Description</Label>
          <textarea
            id="product-description"
            rows={5}
            maxLength={10000}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'product-description-error' : undefined}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            {...register('description')}
          />
          {errors.description?.message && (
            <ValidationMessage id="product-description-error">
              {errors.description.message}
            </ValidationMessage>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="product-category">Category</Label>
            <select
              id="product-category"
              className={selectClasses}
              {...categoryRegistration}
              onChange={(event) => {
                void categoryRegistration.onChange(event)
                setValue('attributes', {}, { shouldDirty: true })
              }}
            >
              <option value="">Choose a category</option>
              {currentCategoryId &&
                !categories.some((category) => category._id === currentCategoryId) && (
                  <option value={currentCategoryId} disabled>
                    Current category is unavailable
                  </option>
                )}
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId?.message && (
              <ValidationMessage>{errors.categoryId.message}</ValidationMessage>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="product-brand">Brand</Label>
            <select id="product-brand" className={selectClasses} {...register('brandId')}>
              <option value="">No brand</option>
              {currentBrandId && !brands.some((brand) => brand._id === currentBrandId) && (
                <option value={currentBrandId} disabled>
                  Current brand is unavailable
                </option>
              )}
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="product-condition">Condition</Label>
            <select id="product-condition" className={selectClasses} {...register('condition')}>
              <option value="">Choose a condition</option>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        {selectedCategory && selectedCategory.attributes.length > 0 && (
          <fieldset className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
            <legend className="px-1 text-card-heading font-semibold text-text-primary">
              Category details
            </legend>
            <p className="text-supporting text-text-secondary sm:col-span-2">
              Fields marked “required for review” must be completed before submission.
            </p>
            {selectedCategory.attributes.map((attribute) => (
              <CategoryAttributeField
                key={attribute.slug}
                control={control}
                attribute={attribute}
              />
            ))}
          </fieldset>
        )}

        <fieldset
          disabled={!canEditOptions}
          className="space-y-4 rounded-lg border border-border p-4 disabled:opacity-70"
        >
          <legend className="px-1 text-card-heading font-semibold text-text-primary">
            Product options
          </legend>

          {isCheckingVariants ? (
            <p className="text-supporting text-text-secondary">
              Checking whether this product already has variants…
            </p>
          ) : hasVariants ? (
            <p className="text-supporting text-warning">
              Product options are locked because variants already exist. This keeps variant
              configurations consistent.
            </p>
          ) : variantCheckError ? (
            <div className="space-y-2">
              <p className="text-supporting text-error">
                Could not check existing variants. Options are read-only until the check succeeds.
              </p>
              <Button type="button" variant="outline" size="small" onClick={onRetryVariantCheck}>
                Retry variant check
              </Button>
            </div>
          ) : (
            <p className="text-supporting text-text-secondary">
              Options define the configurations sellers can offer, such as size or color. Add
              options before creating variants.
            </p>
          )}

          {optionFields.fields.map((option, index) => (
            <div key={option.id} className="grid gap-3 sm:grid-cols-2">
              <FormField
                id={`option-name-${index}`}
                label="Option name"
                placeholder="For example, Size"
                error={errors.options?.[index]?.name?.message}
                {...register(`options.${index}.name`)}
              />
              <FormField
                id={`option-values-${index}`}
                label="Allowed values"
                hint="Separate values with commas, such as Small, Medium, Large."
                placeholder="Small, Medium, Large"
                error={errors.options?.[index]?.valuesText?.message}
                {...register(`options.${index}.valuesText`)}
              />
              <Button
                type="button"
                variant="outline"
                size="small"
                disabled={!canEditOptions}
                className="sm:col-span-2 sm:justify-self-start"
                onClick={() => optionFields.remove(index)}
              >
                Remove option
              </Button>
            </div>
          ))}

          {canEditOptions && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => optionFields.append({ name: '', valuesText: '' })}
            >
              Add option
            </Button>
          )}
        </fieldset>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={() => {
            if (isDirty) setShowDiscardDialog(true)
            else onCancel()
          }}
        >
          Back to products
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? mode === 'create'
              ? 'Creating draft…'
              : 'Saving…'
            : mode === 'create'
              ? 'Create draft'
              : 'Save details'}
        </Button>
      </div>

      <ConfirmationDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        title="Discard unsaved changes?"
        description="Your edits will be lost if you return to the product list without saving."
        confirmLabel="Discard changes"
        tone="danger"
        onConfirm={onCancel}
      />
    </form>
  )
}
