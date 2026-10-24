import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { Notification } from '../components/feedback/Notification'
import { SuccessState } from '../components/feedback/SuccessState'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import GoogleSignInButton from '../features/auth/components/GoogleSignInButton'
import { useAuth } from '../features/auth/hooks/useAuth'
import { login } from '../features/auth/api/login'
import {
  loginSchema,
  type LoginFormValues,
  type LoginRequest,
} from '../features/auth/schemas/login.schema'
import { getApiError } from '../lib/apiError'

interface LoginNotice {
  title: string
  message: string
}

/** Provides password and Google sign-in with shared authentication feedback. */
export default function LoginPage() {
  const { signIn, user } = useAuth()
  const location = useLocation()

  const logoutRequestFailed =
    typeof location.state === 'object' &&
    location.state !== null &&
    'logoutRequestFailed' in location.state &&
    location.state.logoutRequestFailed === true

  const [notice, setNotice] = useState<LoginNotice | null>(
    logoutRequestFailed
      ? {
          title: 'Signed out on this device',
          message:
            'The server could not confirm sign-out. Please try again if you still have an active session.',
        }
      : null,
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues, unknown, LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const emailRegistration = register('email')
  const passwordRegistration = register('password')

  const onSubmit = async (request: LoginRequest) => {
    setNotice(null)

    try {
      const response = await login(request)
      signIn(response.data.user, response.data.tokens.accessToken)
    } catch (error) {
      const apiError = getApiError(error)

      const messages: Record<string, LoginNotice> = {
        INVALID_CREDENTIALS: {
          title: 'Sign-in failed',
          message: 'The email address or password is incorrect. Check your details and try again.',
        },
        EMAIL_NOT_VERIFIED: {
          title: 'Verify your email address',
          message: apiError.message,
        },
        ACCOUNT_UNAVAILABLE: {
          title: 'Sign-in unavailable',
          message: apiError.message,
        },
      }

      setNotice(
        messages[apiError.code] ?? {
          title: 'Unable to sign in',
          message: apiError.message,
        },
      )
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-page-title font-bold text-text-primary">Sign in</h1>
      <p className="mt-2 text-body text-text-secondary">Sign in to your Tennis-Xpress account.</p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        {user ? (
          <SuccessState
            title="You’re signed in"
            description={`Welcome, ${user.userName || user.email}.`}
          />
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
              autoComplete="current-password"
              required
              error={errors.password?.message}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="text-supporting text-text-secondary">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <GoogleSignInButton />

            <div className="grid gap-2 text-supporting">
              <p>
                New to Tennis-Xpress?{' '}
                <Link className="font-medium text-primary underline" to="/register">
                  Create an account
                </Link>
              </p>
              <p>
                <Link className="font-medium text-primary underline" to="/forgot-password">
                  Forgot your password?
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
