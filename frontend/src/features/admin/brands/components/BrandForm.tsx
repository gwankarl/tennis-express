import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Notification } from '../../../../components/feedback/Notification'
import { Button } from '../../../../components/ui/Button'
import { FormField } from '../../../../components/ui/FormField'
import { Label } from '../../../../components/ui/Label'
import { ValidationMessage } from '../../../../components/ui/ValidationMessage'
import { getApiError } from '../../../../lib/apiError'
import type { CreateBrandRequest } from '../types'
import type { Brand } from '../types'
import { brandFormSchema, type BrandFormValues } from '../schemas/brandForm.schema'

const allowedLogoTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxLogoSizeBytes = 5 * 1024 * 1024

interface BrandFormProps {
  brand: Brand | null
  isSaving: boolean
  onCancel: () => void
  onSave: (fields: CreateBrandRequest, logo?: File) => Promise<void>
}

/** Collects the editable brand fields and an optional logo upload. */
export function BrandForm({ brand, isSaving, onCancel, onSave }: BrandFormProps) {
  const [logo, setLogo] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: brand?.name ?? '',
      description: brand?.description ?? '',
    },
  })

  const submitForm = async (values: BrandFormValues) => {
    setSaveError(null)

    try {
      await onSave(
        {
          name: values.name.trim(),
          description: values.description.trim(),
        },
        logo ?? undefined,
      )
    } catch (error) {
      setSaveError(getApiError(error).message)
    }
  }

  const handleLogoChange = (file: File | undefined) => {
    setLogo(null)
    setLogoError(null)

    if (!file) return

    if (!allowedLogoTypes.includes(file.type)) {
      setLogoError('Choose a JPEG, PNG, or WebP image.')
      return
    }

    if (file.size === 0 || file.size > maxLogoSizeBytes) {
      setLogoError('The logo must be larger than 0 bytes and no more than 5 MB.')
      return
    }

    setLogo(file)
  }

  const nameRegistration = register('name')
  const descriptionRegistration = register('description')

  return (
    <form noValidate aria-busy={isSaving} onSubmit={handleSubmit(submitForm)} className="space-y-5">
      <h2 className="text-section-heading font-semibold text-text-primary">
        {brand ? 'Edit brand' : 'Add brand'}
      </h2>

      {saveError && (
        <Notification
          tone="error"
          title="Brand could not be saved"
          message={saveError}
          onDismiss={() => setSaveError(null)}
        />
      )}

      <FormField
        {...nameRegistration}
        inputRef={nameRegistration.ref}
        id="brand-name"
        label="Brand name"
        autoComplete="organization"
        required
        maxLength={120}
        disabled={isSaving}
        error={errors.name?.message}
      />

      <div className="grid gap-1.5">
        <Label htmlFor="brand-description">Description</Label>
        <textarea
          {...descriptionRegistration}
          id="brand-description"
          rows={4}
          maxLength={2000}
          disabled={isSaving}
          aria-invalid={Boolean(errors.description) || undefined}
          aria-describedby={errors.description ? 'brand-description-error' : undefined}
          className={[
            'w-full rounded-md border bg-surface p-3 text-body text-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'disabled:cursor-not-allowed disabled:bg-disabled-background disabled:text-disabled-text',
            errors.description ? 'border-error' : 'border-border',
          ].join(' ')}
        />
        {errors.description?.message && (
          <ValidationMessage id="brand-description-error">
            {errors.description.message}
          </ValidationMessage>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="brand-logo">{brand ? 'Replace logo' : 'Logo'}</Label>
        <input
          id="brand-logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isSaving}
          aria-invalid={Boolean(logoError) || undefined}
          aria-describedby={logoError ? 'brand-logo-error' : 'brand-logo-help'}
          onChange={(event) => {
            handleLogoChange(event.currentTarget.files?.[0])
            event.currentTarget.value = ''
          }}
          className="block w-full text-supporting text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-medium file:text-primary"
        />

        <p id="brand-logo-help" className="text-supporting text-text-secondary">
          Optional. JPEG, PNG, or WebP; maximum file size 5 MB.
          {brand ? ' Leave empty to keep the current logo.' : ''}
        </p>

        {logoError && <ValidationMessage id="brand-logo-error">{logoError}</ValidationMessage>}

        {brand?.logo && (
          <img
            src={brand.logo.secureUrl}
            alt={`${brand.name} logo`}
            className="size-20 rounded-md border border-border bg-surface object-contain p-2"
          />
        )}

        {logo && (
          <p className="break-all text-supporting text-text-secondary">Selected: {logo.name}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving || Boolean(logoError)}>
          {isSaving ? 'Saving…' : brand ? 'Save changes' : 'Add brand'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
