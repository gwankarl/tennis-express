import axios from 'axios'

export interface ApiErrorDetail {
  field: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: ApiErrorDetail[]
  }
}

export interface ApiError {
  code: string
  message: string
  details?: ApiErrorDetail[]
  status?: number
}

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const response = error.response

    if (response?.data?.error) {
      return {
        ...response.data.error,
        status: response.status,
      }
    }

    if (!response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Check your connection and try again.',
      }
    }

    return {
      code: 'HTTP_ERROR',
      message: 'The request could not be completed. Please try again.',
      status: response.status,
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  }
}
