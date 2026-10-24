import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { getApiError } from '../lib/apiError'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { Notification } from '../components/feedback/Notification'
import { SuccessState } from '../components/feedback/SuccessState'
import { PageHeading } from '../components/layout/PageHeading'
import { registerAccount } from '../features/auth/api/register'
import {
  registerSchema,
  type RegisterFormValues,
  type RegisterRequest,
} from '../features/auth/schemas/register.schema'

const genericRegistrationMessage =
  'If registration can be completed, verification instructions will be sent to the supplied email address.'

interface RegistrationNotice {
  title: string
  message: string
}

const registrationFieldNames = ['userName', 'email', 'password'] as const
type RegistrationFieldName = (typeof registrationFieldNames)[number]

/**
 * Provides the public account registration form and request feedback.
 */
export default function RegistrationPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<RegistrationNotice | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues, unknown, RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userName: '',
      email: '',
      password: '',
    },
  })

  const userNameRegistration = register('userName')
  const emailRegistration = register('email')
  const passwordRegistration = register('password')

  const onSubmit = async (request: RegisterRequest) => {
    setNotice(null)

    try {
      const response = await registerAccount(request)
      setSuccessMessage(response.data.message)
    } catch (error) {
      const apiError = getApiError(error)

      // Keep duplicate-email feedback indistinguishable from ordinary success.
      if (apiError.code === 'EMAIL_ALREADY_REGISTERED') {
        setSuccessMessage(genericRegistrationMessage)
        return
      }

      for (const detail of apiError.details ?? []) {
        if (registrationFieldNames.includes(detail.field as RegistrationFieldName)) {
          setError(detail.field as RegistrationFieldName, {
            type: 'server',
            message: detail.message,
          })
        }
      }

      setNotice({
        title:
          apiError.code === 'PASSWORD_COMPROMISED'
            ? 'Choose a different password'
            : 'Registration could not be completed',
        message: apiError.message,
      })
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <PageHeading title="Create your account" description="Enter your details to get started." />

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        {successMessage ? (
          <SuccessState title="Check your email" description={successMessage} />
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-5"
            aria-busy={isSubmitting}
          >
            {notice && (
              <Notification
                tone="error"
                title={notice.title}
                message={notice.message}
                onDismiss={() => setNotice(null)}
              />
            )}

            <FormField
              {...userNameRegistration}
              inputRef={userNameRegistration.ref}
              id="userName"
              label="User name"
              autoComplete="name"
              required
              error={errors.userName?.message}
            />

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

            <FormField
              {...passwordRegistration}
              inputRef={passwordRegistration.ref}
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              hint="Use 12 to 128 characters."
              error={errors.password?.message}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
