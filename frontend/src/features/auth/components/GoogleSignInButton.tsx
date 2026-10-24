import { useCallback, useEffect, useRef, useState } from 'react'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { Notification } from '../../../components/feedback/Notification'
import { useAuth } from '../hooks/useAuth'
import { googleLogin } from '../api/googleLogin'
import { getApiError } from '../../../lib/apiError'

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
      }) => void
      renderButton: (
        container: HTMLElement,
        options: {
          theme: 'outline'
          size: 'large'
          text: 'signin_with'
          shape: 'rectangular'
          logo_alignment: 'left'
          width: number
        },
      ) => void
    }
  }
}

type GoogleWindow = Window & {
  google?: GoogleIdentityServices
}

let googleScriptPromise: Promise<GoogleIdentityServices> | null = null
let initializedClientId: string | null = null
let activeCredentialHandler: ((idToken: string) => void) | null = null

function loadGoogleIdentityServices(): Promise<GoogleIdentityServices> {
  const google = (window as GoogleWindow).google

  if (google) {
    return Promise.resolve(google)
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise<GoogleIdentityServices>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        const loadedGoogle = (window as GoogleWindow).google

        if (loadedGoogle) {
          resolve(loadedGoogle)
        } else {
          reject(new Error('Google Identity Services did not initialize.'))
        }
      }
      script.onerror = () => reject(new Error('Google Identity Services failed to load.'))
      document.head.append(script)
    }).catch((error: unknown) => {
      googleScriptPromise = null
      throw error
    })
  }

  return googleScriptPromise
}

/** Renders Google’s sign-in button and authenticates its returned ID token. */
export default function GoogleSignInButton() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''
  const { signIn } = useAuth()
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(Boolean(clientId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null)
  const [setupErrorMessage, setSetupErrorMessage] = useState<string | null>(
    clientId ? null : 'Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID.',
  )

  const handleCredential = useCallback(
    async (idToken: string) => {
      setApiErrorMessage(null)
      setIsSubmitting(true)

      try {
        const response = await googleLogin(idToken)
        signIn(response.data.user, response.data.tokens.accessToken)
      } catch (error) {
        setApiErrorMessage(getApiError(error).message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [signIn],
  )

  useEffect(() => {
    if (!clientId) return

    let isMounted = true
    let resizeObserver: ResizeObserver | undefined
    activeCredentialHandler = handleCredential

    loadGoogleIdentityServices()
      .then((google) => {
        const buttonContainer = buttonContainerRef.current

        if (!isMounted || !buttonContainer) return

        if (initializedClientId !== clientId) {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: ({ credential }) => {
              activeCredentialHandler?.(credential)
            },
          })
          initializedClientId = clientId
        }

        const renderButton = () => {
          const width = buttonContainer.clientWidth

          if (!buttonContainer.isConnected || width === 0) return

          buttonContainer.replaceChildren()
          google.accounts.id.renderButton(buttonContainer, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: Math.min(width, 400),
          })
        }

        renderButton()
        resizeObserver = new ResizeObserver(renderButton)
        resizeObserver.observe(buttonContainer)
        setIsLoadingLibrary(false)
      })
      .catch(() => {
        if (!isMounted) return

        setIsLoadingLibrary(false)
        setSetupErrorMessage('Google sign-in could not be loaded. Please try again later.')
      })

    return () => {
      isMounted = false
      resizeObserver?.disconnect()

      if (activeCredentialHandler === handleCredential) {
        activeCredentialHandler = null
      }
    }
  }, [clientId, handleCredential])

  if (setupErrorMessage) {
    return (
      <Notification tone="error" title="Google sign-in unavailable" message={setupErrorMessage} />
    )
  }

  return (
    <div className="grid gap-3">
      {apiErrorMessage && (
        <Notification
          tone="error"
          title="Google sign-in failed"
          message={apiErrorMessage}
          onDismiss={() => setApiErrorMessage(null)}
        />
      )}

      <div aria-busy={isLoadingLibrary || isSubmitting} className="relative min-h-11 w-full">
        <div
          ref={buttonContainerRef}
          aria-hidden={isSubmitting}
          className={[
            'flex min-h-11 w-full justify-center',
            isSubmitting ? 'pointer-events-none invisible' : '',
          ].join(' ')}
        />

        {(isLoadingLibrary || isSubmitting) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-page px-3">
            <LoadingState
              label={isSubmitting ? 'Signing in with Google…' : 'Loading Google sign-in…'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
