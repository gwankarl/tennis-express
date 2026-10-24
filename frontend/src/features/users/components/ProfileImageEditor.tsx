import { useState } from 'react'
import { Notification } from '../../../components/feedback/Notification'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { getApiError } from '../../../lib/apiError'
import type { UserProfileImage } from '../types'

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSizeBytes = 5 * 1024 * 1024

interface ProfileImageEditorProps {
  userName: string
  image: UserProfileImage | null
  isUploading: boolean
  onUpload: (file: File) => Promise<void>
}

/** Displays the current profile image and handles selecting/uploading its replacement. */
export function ProfileImageEditor({
  userName,
  image,
  isUploading,
  onUpload,
}: ProfileImageEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleFileChange = (file: File | undefined) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setSelectedFile(null)

    if (!file) return

    if (!allowedImageTypes.some((type) => type === file.type)) {
      setErrorMessage('Choose a JPEG, PNG, or WebP image.')
      return
    }

    if (file.size === 0 || file.size > maxImageSizeBytes) {
      setErrorMessage('The image must be larger than 0 bytes and no more than 5 MB.')
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
      setSuccessMessage('Your profile image has been updated.')
    } catch (error) {
      setErrorMessage(getApiError(error).message)
    }
  }

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-8">
      <h2 className="text-section-heading font-semibold text-text-primary">Profile image</h2>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        {image ? (
          <img
            src={image.secureUrl}
            alt={`${userName}'s profile`}
            className="size-24 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            aria-label={`Profile image placeholder for ${userName}`}
            role="img"
            className="flex size-24 items-center justify-center rounded-full bg-secondary text-section-heading font-semibold text-primary"
          >
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="profile-image">Choose a new image</Label>
            <Input
              id="profile-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading}
              onChange={(event) => {
                handleFileChange(event.currentTarget.files?.[0])
                event.currentTarget.value = ''
              }}
            />
            <p className="text-supporting text-text-secondary">
              JPEG, PNG, or WebP; maximum file size 5 MB.
            </p>
          </div>

          {selectedFile && (
            <p className="break-all text-supporting text-text-secondary">
              Selected: {selectedFile.name}
            </p>
          )}

          <Button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload image'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-5">
          <Notification
            tone="error"
            title="Image could not be uploaded"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        </div>
      )}

      {successMessage && (
        <div className="mt-5">
          <Notification
            tone="success"
            title="Image updated"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
          />
        </div>
      )}
    </section>
  )
}
