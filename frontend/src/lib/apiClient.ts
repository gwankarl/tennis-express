import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error('VITE_API_URL must be set before the frontend starts.')
}

/**
 * Shared Axios instance for requests to the Tennis-Xpress API.
 */
export const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
})
