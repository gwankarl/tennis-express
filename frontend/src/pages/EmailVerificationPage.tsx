import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ErrorState } from '../components/feedback/ErrorState'
import { LoadingState } from '../components/feedback/LoadingState'
import { SuccessState } from '../components/feedback/SuccessState'
import { PageHeading } from '../components/layout/PageHeading'
import { Button } from '../components/ui/Button'
import { getApiError } from '../lib/apiError'
import { verifyEmail } from '../features/auth/api/verifyEmail'

type VerificationState = 'ready' | 'loading' | 'success' | 'invalid' | 'error'

const verificationTokenPattern = /^[a-f0-9]{64}$/

/**
 * Lets a user verify their email address from the token in the email link.
 */
export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const hasValidToken = token !== null && verificationTokenPattern.test(token)

  const [state, setState] = useState<VerificationState>('ready')
  const [message, setMessage] = useState('')

  const handleVerification = async () => {
    if (!token || !hasValidToken) {
      setState('invalid')
      return
    }

    setState('loading')
    setMessage('')

    try {
      const response = await verifyEmail(token)
      setMessage(response.data.message)
      setState('success')
    } catch (error) {
      const apiError = getApiError(error)
      setMessage(apiError.message)

      if (apiError.code === 'VERIFICATION_TOKEN_INVALID') {
        setState('invalid')
      } else {
        setState('error')
      }
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <PageHeading
        title="Email verification"
        description="Complete email verification for your Tennis-Xpress account."
      />

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        {!hasValidToken || state === 'invalid' ? (
          <ErrorState
            title="Verification link is invalid or expired"
            description={
              message ||
              'This verification link cannot be used. Request a new verification email if needed.'
            }
          />
        ) : state === 'loading' ? (
          <LoadingState label="Verifying your email address…" />
        ) : state === 'success' ? (
          <SuccessState
            title="Email verified"
            description={message}
            action={
              <Link
                to="/login"
                className="inline-flex rounded-md bg-primary px-4 py-2 text-body font-medium text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Go to sign in
              </Link>
            }
          />
        ) : state === 'error' ? (
          <ErrorState
            title="We couldn’t verify your email"
            description={message}
            onRetry={() => void handleVerification()}
            retryLabel="Try again"
          />
        ) : (
          <div className="grid gap-4">
            <p className="text-body text-text-secondary">
              Select the button below to verify your email address.
            </p>
            <Button onClick={() => void handleVerification()}>Verify email address</Button>
          </div>
        )}
      </div>
    </section>
  )
}
