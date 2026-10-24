/** Contact method supported by the backend profile schema. */
export type PreferredContactMethod = 'email' | 'phone'

/** Profile image reference returned by the user-account API. */
export interface UserProfileImage {
  publicId: string
  secureUrl: string
}

/** Profile and contact fields returned by the backend. */
export interface UserProfile {
  userName: string
  image: UserProfileImage | null
  contactDetails: {
    phoneNumber?: string
    preferredContactMethod?: PreferredContactMethod
  }
}

/** Account information returned for the authenticated user. */
export interface CurrentUser {
  id: string
  email: string
  emailVerifiedAt: string | null
  roles: string[]
  status: string
  profile: UserProfile
  notificationPreferences: {
    email: boolean
    inApp: boolean
  }
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

/** Success envelope used by the user-account endpoints. */
export interface CurrentUserResponse {
  success: true
  data: {
    user: CurrentUser
  }
}
