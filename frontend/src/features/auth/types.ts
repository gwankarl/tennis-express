/** User information held by the frontend after successful sign-in. */
export interface AuthUser {
  id: string
  email: string
  userName: string
  roles: string[]
  status: string
}
