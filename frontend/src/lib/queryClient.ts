import { QueryClient } from '@tanstack/react-query'
import { getApiError } from './apiError'

/**
 * Shared cache and default query behavior for the frontend.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (failureCount >= 1) return false

        const apiError = getApiError(error)

        // Retry network failures and server errors once; client errors need user action.
        return (
          apiError.code === 'NETWORK_ERROR' ||
          (apiError.status !== undefined && apiError.status >= 500)
        )
      },
    },
  },
})
