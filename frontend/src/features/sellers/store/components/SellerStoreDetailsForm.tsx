import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, type FieldError, type UseFormRegister } from 'react-hook-form'

import { Notification } from '../../../../components/feedback/Notification'
import { Button } from '../../../../components/ui/Button'
import { FormField } from '../../../../components/ui/FormField'
import { Label } from '../../../../components/ui/Label'
import { ValidationMessage } from '../../../../components/ui/ValidationMessage'
import { getApiError } from '../../../../lib/apiError'
import type { SellerStore, UpdateSellerStoreRequest } from '../types'
import { sellerDispatchTimes, sellerFulfilmentMethods, sellerStoreRegions } from '../types'
import { storeDetailsSchema, type StoreDetailsFormValues } from '../schemas/storeDetails.schema'

interface SellerStoreDetailsFormProps {
  store: SellerStore
  isSaving: boolean
  onCancel: () => void
  onSave: (changes: UpdateSellerStoreRequest) => Promise<void>
}

/** Edits the seller-editable details of a storefront. */
export function SellerStoreDetailsForm({
  store,
  isSaving,
  onCancel,
  onSave,
}: SellerStoreDetailsFormProps) {
  const [saveError, setSaveError] = useState<string | null>(null)
  const [fulfilmentEnabled, setFulfilmentEnabled] = useState(store.fulfilmentProfile !== null)
  const [returnPolicyEnabled, setReturnPolicyEnabled] = useState(store.returnPolicy !== null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreDetailsFormValues>({
    resolver: zodResolver(storeDetailsSchema),
    defaultValues: {
      name: store.name,
      description: store.description,
      location: store.location,
      fulfilmentProfile: store.fulfilmentProfile ?? {
        methods: ['delivery'],
        serviceRegions: [store.location.region],
        dispatchTime: 'one_to_three_days',
      },
      deliveryOptions: store.deliveryOptions,
      collectionOptions: store.collectionOptions,
      returnPolicy: {
        summary: store.returnPolicy?.summary ?? '',
        returnWindowDays: store.returnPolicy?.returnWindowDays ?? 0,
        conditionsText: store.returnPolicy?.conditions.join('\n') ?? '',
      },
    },
  })

  const deliveryOptions = useFieldArray({ control, name: 'deliveryOptions' })
  const collectionOptions = useFieldArray({ control, name: 'collectionOptions' })

  const submitForm = async (values: StoreDetailsFormValues) => {
    setSaveError(null)

    const changes: UpdateSellerStoreRequest = {
      name: values.name,
      description: values.description,
      location: values.location,
      fulfilmentProfile: fulfilmentEnabled ? values.fulfilmentProfile : null,
      deliveryOptions: values.deliveryOptions,
      collectionOptions: values.collectionOptions,
      returnPolicy: returnPolicyEnabled
        ? {
            summary: values.returnPolicy.summary,
            returnWindowDays: values.returnPolicy.returnWindowDays,
            conditions: values.returnPolicy.conditionsText
              .split('\n')
              .map((condition) => condition.trim())
              .filter(Boolean),
          }
        : null,
    }

    try {
      await onSave(changes)
    } catch (error) {
      // Keep the form mounted so entered values remain available for correction or retry.
      setSaveError(getApiError(error).message)
    }
  }

  const nameRegistration = register('name')
  const descriptionRegistration = register('description')
  const regionRegistration = register('location.region')
  const cityRegistration = register('location.city')
  const addressRegistration = register('location.address')

  return (
    <form noValidate aria-busy={isSaving} onSubmit={handleSubmit(submitForm)} className="space-y-6">
      <h2 className="text-section-heading font-semibold text-text-primary">Edit store details</h2>

      {saveError && (
        <Notification
          tone="error"
          title="Store details could not be saved"
          message={saveError}
          onDismiss={() => setSaveError(null)}
        />
      )}

      <FormField
        {...nameRegistration}
        inputRef={nameRegistration.ref}
        id="store-name"
        label="Store name"
        autoComplete="organization"
        required
        maxLength={100}
        disabled={isSaving}
        error={errors.name?.message}
      />

      <div className="grid gap-1.5">
        <Label htmlFor="store-description" required>
          Description
        </Label>
        <textarea
          {...descriptionRegistration}
          id="store-description"
          rows={4}
          maxLength={2000}
          required
          disabled={isSaving}
          aria-invalid={Boolean(errors.description) || undefined}
          className="w-full rounded-md border border-border bg-surface p-3 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:bg-disabled-background"
        />
        {errors.description?.message && (
          <ValidationMessage id="store-description-error">
            {errors.description.message}
          </ValidationMessage>
        )}
      </div>

      <fieldset className="space-y-4">
        <legend className="text-card-heading font-semibold text-text-primary">
          Operating location
        </legend>

        <div className="grid gap-1.5">
          <Label htmlFor="store-region" required>
            Region
          </Label>
          <select
            {...regionRegistration}
            id="store-region"
            disabled={isSaving}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {sellerStoreRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            {...cityRegistration}
            inputRef={cityRegistration.ref}
            id="store-city"
            label="City or town"
            required
            maxLength={100}
            disabled={isSaving}
            error={errors.location?.city?.message}
          />
          <FormField
            {...addressRegistration}
            inputRef={addressRegistration.ref}
            id="store-address"
            label="Operating address"
            required
            maxLength={300}
            disabled={isSaving}
            error={errors.location?.address?.message}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-card-heading font-semibold text-text-primary">
          Fulfilment
        </legend>

        <label className="flex min-h-11 items-center gap-3 text-body text-text-primary">
          <input
            type="checkbox"
            checked={fulfilmentEnabled}
            onChange={(event) => setFulfilmentEnabled(event.target.checked)}
            disabled={isSaving}
          />
          Offer fulfilment through this store
        </label>

        {fulfilmentEnabled && (
          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-form-label font-medium text-text-primary">
                Available methods
              </legend>
              {sellerFulfilmentMethods.map((method) => (
                <label key={method} className="flex min-h-11 items-center gap-3 text-body">
                  <input
                    type="checkbox"
                    value={method}
                    {...register('fulfilmentProfile.methods')}
                    disabled={isSaving}
                  />
                  {method === 'delivery' ? 'Delivery' : 'Collection'}
                </label>
              ))}
              {errors.fulfilmentProfile?.methods?.message && (
                <ValidationMessage>{errors.fulfilmentProfile.methods.message}</ValidationMessage>
              )}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-form-label font-medium text-text-primary">
                Service regions
              </legend>
              <div className="grid gap-1 sm:grid-cols-2">
                {sellerStoreRegions.map((region) => (
                  <label key={region} className="flex min-h-11 items-center gap-3 text-body">
                    <input
                      type="checkbox"
                      value={region}
                      {...register('fulfilmentProfile.serviceRegions')}
                      disabled={isSaving}
                    />
                    {region}
                  </label>
                ))}
              </div>
              {errors.fulfilmentProfile?.serviceRegions?.message && (
                <ValidationMessage>
                  {errors.fulfilmentProfile.serviceRegions.message}
                </ValidationMessage>
              )}
            </fieldset>

            <div className="grid gap-1.5">
              <Label htmlFor="store-dispatch-time" required>
                Dispatch time
              </Label>
              <select
                id="store-dispatch-time"
                {...register('fulfilmentProfile.dispatchTime')}
                disabled={isSaving}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {sellerDispatchTimes.map((time) => (
                  <option key={time} value={time}>
                    {time.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </fieldset>

      <OptionEditor
        title="Delivery options"
        name="deliveryOptions"
        fields={deliveryOptions.fields}
        register={register}
        onAdd={() => deliveryOptions.append({ name: '', description: '', fee: 0 })}
        onRemove={deliveryOptions.remove}
        disabled={isSaving}
        errors={getOptionErrors(errors.deliveryOptions)}
      />

      <OptionEditor
        title="Collection options"
        name="collectionOptions"
        fields={collectionOptions.fields}
        register={register}
        onAdd={() => collectionOptions.append({ name: '', description: '', fee: 0 })}
        onRemove={collectionOptions.remove}
        disabled={isSaving}
        errors={getOptionErrors(errors.collectionOptions)}
      />

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-card-heading font-semibold text-text-primary">
          Return policy
        </legend>

        <label className="flex min-h-11 items-center gap-3 text-body text-text-primary">
          <input
            type="checkbox"
            checked={returnPolicyEnabled}
            onChange={(event) => setReturnPolicyEnabled(event.target.checked)}
            disabled={isSaving}
          />
          Publish a return policy
        </label>

        {returnPolicyEnabled && (
          <>
            <FormField
              {...register('returnPolicy.summary')}
              id="store-return-summary"
              label="Policy summary"
              required
              disabled={isSaving}
            />
            <FormField
              {...register('returnPolicy.returnWindowDays', { valueAsNumber: true })}
              id="store-return-window"
              label="Return window in days"
              type="number"
              min={0}
              required
              disabled={isSaving}
              error={errors.returnPolicy?.returnWindowDays?.message}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="store-return-conditions">Conditions (one per line)</Label>
              <textarea
                {...register('returnPolicy.conditionsText')}
                id="store-return-conditions"
                rows={4}
                disabled={isSaving}
                className="w-full rounded-md border border-border bg-surface p-3 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="text-supporting text-text-secondary">
                Leave blank if your policy has no additional conditions.
              </p>
            </div>
          </>
        )}
      </fieldset>

      <p className="text-supporting text-text-secondary">
        Store URL slug: <span className="break-all font-medium">{store.slug}</span>
        {' — '}The slug is not editable through the current backend endpoint.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

interface OptionEditorProps {
  title: string
  name: 'deliveryOptions' | 'collectionOptions'
  fields: Array<{ id: string }>
  register: UseFormRegister<StoreDetailsFormValues>
  onAdd: () => void
  onRemove: (index: number) => void
  disabled: boolean
  errors?: Array<
    | {
        name?: FieldError
        description?: FieldError
        fee?: FieldError
      }
    | undefined
  >
}

type OptionItemErrors = {
  name?: FieldError
  description?: FieldError
  fee?: FieldError
}

/** Narrows React Hook Form's array-or-root error type to per-option errors. */
function getOptionErrors(value: unknown): Array<OptionItemErrors | undefined> | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value as Array<OptionItemErrors | undefined>
}

/** Edits a repeatable set of seller-defined delivery or collection options. */
function OptionEditor({
  title,
  name,
  fields,
  register,
  onAdd,
  onRemove,
  disabled,
  errors,
}: OptionEditorProps) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="px-1 text-card-heading font-semibold text-text-primary">{title}</legend>

      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-4 rounded-md bg-page p-4 sm:grid-cols-3">
          <FormField
            {...register(`${name}.${index}.name`)}
            id={`${name}-${index}-name`}
            label="Option name"
            required
            disabled={disabled}
            error={errors?.[index]?.name?.message}
          />
          <FormField
            {...register(`${name}.${index}.description`)}
            id={`${name}-${index}-description`}
            label="Description"
            required
            disabled={disabled}
            error={errors?.[index]?.description?.message}
          />
          <FormField
            {...register(`${name}.${index}.fee`, { valueAsNumber: true })}
            id={`${name}-${index}-fee`}
            label="Fee"
            type="number"
            min={0}
            required
            disabled={disabled}
            error={errors?.[index]?.fee?.message}
          />
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="sm:col-span-3 sm:justify-self-end"
          >
            Remove option
          </Button>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={onAdd} disabled={disabled}>
        Add {title.toLowerCase().replace(' options', ' option')}
      </Button>
    </fieldset>
  )
}
