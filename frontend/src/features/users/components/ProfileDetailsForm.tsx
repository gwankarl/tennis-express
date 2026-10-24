import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Notification } from '../../../components/feedback/Notification'
import { SuccessState } from '../../../components/feedback/SuccessState'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Label } from '../../../components/ui/Label'
import { ValidationMessage } from '../../../components/ui/ValidationMessage'
import { getApiError } from '../../../lib/apiError'
import { profileUpdateSchema, type ProfileUpdateFormValues } from '../schemas/profileUpdate.schema'
import type { UpdateProfileRequest } from '../api/updateProfile'
import type { CurrentUser } from '../types'

interface ProfileDetailsFormProps {
  user: CurrentUser
  isSaving: boolean
  onSave: (request: UpdateProfileRequest) => Promise<CurrentUser>
}

/** Allows viewing and editing the profile fields supported by PATCH /user/me. */
export function ProfileDetailsForm({ user, isSaving, onSave }: ProfileDetailsFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSucceeded, setSaveSucceeded] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: getFormValues(user),
  })

  const userNameRegistration = register('userName')
  const phoneNumberRegistration = register('phoneNumber')
  const contactMethodRegistration = register('preferredContactMethod')

  const handleCancel = () => {
    reset(getFormValues(user))
    clearErrors()
    setSaveError(null)
    setSaveSucceeded(false)
    setIsEditing(false)
  }

  const submitProfile = async (values: ProfileUpdateFormValues) => {
    setSaveError(null)
    setSaveSucceeded(false)
    clearErrors()

    const existingPhoneNumber = user.profile.contactDetails?.phoneNumber ?? ''
    const phoneNumber = values.phoneNumber.trim()

    // The backend rejects an empty phone number and does not support clearing it.
    if (existingPhoneNumber && !phoneNumber) {
      setError('phoneNumber', {
        type: 'manual',
        message: 'This profile endpoint does not support clearing a saved phone number.',
      })
      return
    }

    const request: UpdateProfileRequest = {}
    const contactDetails: NonNullable<UpdateProfileRequest['contactDetails']> = {}

    const userName = values.userName.trim()
    if (userName !== user.profile.userName) {
      request.userName = userName
    }

    if (phoneNumber && phoneNumber !== existingPhoneNumber) {
      contactDetails.phoneNumber = phoneNumber
    }

    const existingContactMethod = user.profile.contactDetails?.preferredContactMethod ?? ''
    if (values.preferredContactMethod && values.preferredContactMethod !== existingContactMethod) {
      contactDetails.preferredContactMethod = values.preferredContactMethod
    }

    if (Object.keys(contactDetails).length > 0) {
      request.contactDetails = contactDetails
    }

    if (Object.keys(request).length === 0) {
      setError('root', {
        type: 'manual',
        message: 'There are no profile changes to save.',
      })
      return
    }

    try {
      const updatedUser = await onSave(request)
      reset(getFormValues(updatedUser))
      setIsEditing(false)
      setSaveSucceeded(true)
    } catch (error) {
      setSaveError(getApiError(error).message)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-section-heading font-semibold text-text-primary">Profile details</h2>
          <p className="mt-1 text-supporting text-text-secondary">
            Your email address and roles are managed by the account system.
          </p>
        </div>

        {!isEditing ? (
          <Button
            type="button"
            onClick={() => {
              setSaveSucceeded(false)
              setIsEditing(true)
            }}
          >
            Edit details
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="user-profile-details" disabled={!isDirty || isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        )}
      </div>

      {saveSucceeded && (
        <div className="mt-5">
          <SuccessState
            title="Profile updated"
            description="Your profile details have been saved."
          />
        </div>
      )}

      {saveError && (
        <div className="mt-5">
          <Notification
            tone="error"
            title="Profile could not be saved"
            message={saveError}
            onDismiss={() => setSaveError(null)}
          />
        </div>
      )}

      {errors.root?.message && (
        <div className="mt-5">
          <Notification
            tone="information"
            title="No changes saved"
            message={errors.root.message}
            onDismiss={() => clearErrors('root')}
          />
        </div>
      )}

      <form
        id="user-profile-details"
        noValidate
        aria-busy={isSaving}
        onSubmit={handleSubmit(submitProfile)}
        className="mt-6 grid gap-5 sm:grid-cols-2"
      >
        <FormField
          {...userNameRegistration}
          inputRef={userNameRegistration.ref}
          id="profile-user-name"
          label="User name"
          autoComplete="name"
          required
          disabled={!isEditing || isSaving}
          error={errors.userName?.message}
        />

        <FormField
          id="profile-email"
          label="Email address"
          type="email"
          value={user.email}
          readOnly
          hint="Email changes are not supported by the profile endpoint."
        />

        <FormField
          {...phoneNumberRegistration}
          inputRef={phoneNumberRegistration.ref}
          id="profile-phone-number"
          label="Phone number"
          type="tel"
          autoComplete="tel"
          disabled={!isEditing || isSaving}
          hint="Optional; up to 25 characters. A saved number cannot be cleared through this endpoint."
          error={errors.phoneNumber?.message}
        />

        <div className="grid content-start gap-1.5">
          <Label htmlFor="profile-contact-method">Preferred contact method</Label>
          <select
            {...contactMethodRegistration}
            id="profile-contact-method"
            disabled={!isEditing || isSaving}
            aria-invalid={Boolean(errors.preferredContactMethod) || undefined}
            aria-describedby={
              errors.preferredContactMethod ? 'profile-contact-method-error' : undefined
            }
            className={[
              'w-full rounded-md border bg-surface px-3 py-2 text-body text-text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:bg-disabled-background disabled:text-disabled-text',
              errors.preferredContactMethod ? 'border-error' : 'border-border',
            ].join(' ')}
          >
            <option value="">Not set</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
          {errors.preferredContactMethod?.message && (
            <ValidationMessage id="profile-contact-method-error">
              {errors.preferredContactMethod.message}
            </ValidationMessage>
          )}
        </div>

        <div className="sm:col-span-2">
          <h3 className="text-card-heading font-semibold text-text-primary">Roles</h3>
          <p className="mt-1 text-supporting text-text-secondary">
            {user.roles.length > 0 ? user.roles.join(', ') : 'No roles assigned'}
          </p>
        </div>
      </form>
    </section>
  )
}

function getFormValues(user: CurrentUser): ProfileUpdateFormValues {
  return {
    userName: user.profile.userName,
    phoneNumber: user.profile.contactDetails?.phoneNumber ?? '',
    preferredContactMethod: user.profile.contactDetails?.preferredContactMethod ?? '',
  }
}
