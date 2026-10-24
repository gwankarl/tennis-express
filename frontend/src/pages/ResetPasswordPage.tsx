import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { Notification } from '../components/feedback/Notification'
import { SuccessState } from '../components/feedback/SuccessState'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { resetPassword } from '../features/auth/api/resetPassword'
import {
  resetPasswordSchema,
  type ResetPasswordFormRequest,
  type ResetPasswordFormValues,
} from '../features/auth/schemas/resetPassword.schema'
import { getApiError } from '../lib/apiError'

const resetTokenPattern = /^[a-f\d]{64}$/i

/** Provides the public form for setting a new password from an email link. */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [tokenRejected, setTokenRejected] = useState(false)
  const [requestFailed, setRequestFailed] = useState(false)

  const token = searchParams.get('token')
  const hasUsableToken = token !== null && resetTokenPattern.test(token)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues, unknown, ResetPasswordFormRequest>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordRegistration = register('password')
  const confirmPasswordRegistration = register('confirmPassword')

  const onSubmit = async (form: ResetPasswordFormRequest) => {
    if (!token) {
      setTokenRejected(true)
      return
    }

    setRequestFailed(false)

    try {
      const response = await resetPassword({
        token,
        password: form.password,
      })
      setSuccessMessage(response.data.message)
    } catch (error) {
      const apiError = getApiError(error)

      if (apiError.code === 'INVALID_OR_EXPIRED_RESET_TOKEN') {
        setTokenRejected(true)
        return
      }

      setRequestFailed(true)
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-page-title font-bold text-text-primary">Reset your password</h1>
      <p className="mt-2 text-body text-text-secondary">Choose a new password for your account.</p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        {successMessage ? (
          <SuccessState
            title="Password reset"
            description={successMessage}
            action={
              <Link className="font-medium text-primary underline" to="/login">
                Back to sign in
              </Link>
            }
          />
        ) : tokenRejected || !hasUsableToken ? (
          <Notification
            tone="error"
            title="Reset link is invalid or expired"
            message="Request a new password-reset link to continue."
          />
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-5"
            aria-busy={isSubmitting}
          >
            {requestFailed && (
              <Notification
                tone="error"
                title="Password reset could not be completed"
                message="Please try again later."
                onDismiss={() => setRequestFailed(false)}
              />
            )}

            <FormField
              {...passwordRegistration}
              inputRef={passwordRegistration.ref}
              id="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              hint="Use 12 to 128 characters."
              error={errors.password?.message}
            />

            <FormField
              {...confirmPasswordRegistration}
              inputRef={confirmPasswordRegistration.ref}
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting password…' : 'Reset password'}
            </Button>
          </form>
        )}

        {(tokenRejected || !hasUsableToken) && (
          <div className="mt-4 grid gap-2 text-supporting">
            <Link className="font-medium text-primary underline" to="/forgot-password">
              Request a new reset link
            </Link>
            <Link className="font-medium text-primary underline" to="/login">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
