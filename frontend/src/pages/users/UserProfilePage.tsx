import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHeading } from '../../components/layout/PageHeading'
import { ProfileDetailsForm } from '../../features/users/components/ProfileDetailsForm'
import { ProfileImageEditor } from '../../features/users/components/ProfileImageEditor'
import { getCurrentUser, currentUserQueryKey } from '../../features/users/api/currentUser'
import { updateProfile } from '../../features/users/api/updateProfile'
import { updateProfileImage } from '../../features/users/api/updateProfileImage'
import { getApiError } from '../../lib/apiError'

/** Loads and coordinates profile detail and image updates for the signed-in user. */
export default function UserProfilePage() {
  const queryClient = useQueryClient()

  const userQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
  })

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(currentUserQueryKey, updatedUser)
    },
  })

  const imageMutation = useMutation({
    mutationFn: updateProfileImage,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(currentUserQueryKey, updatedUser)
    },
  })

  if (userQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeading title="My Profile" description="View and update your profile." />
        <LoadingState label="Loading your profile..." />
      </div>
    )
  }

  if (userQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="My Profile" description="View and update your profile." />
        <ErrorState
          title="Profile could not be loaded"
          description={getApiError(userQuery.error).message}
          onRetry={() => void userQuery.refetch()}
        />
      </div>
    )
  }

  const user = userQuery.data

  return (
    <div className="space-y-6">
      <PageHeading title="My Profile" description="View and update your profile." />

      <ProfileImageEditor
        userName={user.profile.userName}
        image={user.profile.image}
        isUploading={imageMutation.isPending || profileMutation.isPending}
        onUpload={async (file) => {
          await imageMutation.mutateAsync(file)
        }}
      />

      <ProfileDetailsForm
        user={user}
        isSaving={profileMutation.isPending || imageMutation.isPending}
        onSave={(request) => profileMutation.mutateAsync(request)}
      />
    </div>
  )
}
