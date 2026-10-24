import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { Notification } from '../components/feedback/Notification'
import { SuccessState } from '../components/feedback/SuccessState'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { requestPasswordReset } from '../features/auth/api/forgotPassword'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
  type ForgotPasswordRequest,
} from '../features/auth/schemas/forgotPassword.schema'

/** Provides the public form for requesting password-reset instructions. */
export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [requestFailed, setRequestFailed] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues, unknown, ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const emailRegistration = register('email')

  const onSubmit = async (request: ForgotPasswordRequest) => {
    setRequestFailed(false)

    try {
      const response = await requestPasswordReset(request)
      setSuccessMessage(response.data.message)
    } catch {
      setRequestFailed(true)
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-page-title font-bold text-text-primary">Forgot your password?</h1>
      <p className="mt-2 text-body text-text-secondary">
        Enter your email address to request password-reset instructions.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        {successMessage ? (
          <SuccessState
            title="Check your email"
            description={successMessage}
            action={
              <Link className="font-medium text-primary underline" to="/login">
                Back to sign in
              </Link>
            }
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
                title="Request could not be completed"
                message="Please try again later."
                onDismiss={() => setRequestFailed(false)}
              />
            )}

            <FormField
              {...emailRegistration}
              inputRef={emailRegistration.ref}
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending request…' : 'Send instructions'}
            </Button>

            <p className="text-supporting">
              <Link className="font-medium text-primary underline" to="/login">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
