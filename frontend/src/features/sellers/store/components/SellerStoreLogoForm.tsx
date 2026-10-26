import { useEffect, useMemo, useState } from 'react'

import { Notification } from '../../../../components/feedback/Notification'
import { Button } from '../../../../components/ui/Button'
import { Label } from '../../../../components/ui/Label'
import { getApiError } from '../../../../lib/apiError'
import type { SellerStore } from '../types'

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSizeBytes = 5 * 1024 * 1024

interface SellerStoreLogoFormProps {
  store: SellerStore
  isUploading: boolean
  onUpload: (file: File) => Promise<void>
}

/** Displays the current storefront logo and uploads a replacement image. */
export function SellerStoreLogoForm({ store, isUploading, onUpload }: SellerStoreLogoFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadSucceeded, setUploadSucceeded] = useState(false)

  const selectedPreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  )

  useEffect(
    () => () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl)
      }
    },
    [selectedPreviewUrl],
  )

  const handleFileChange = (file: File | undefined) => {
    setFormError(null)
    setUploadSucceeded(false)

    if (!file) return

    if (!allowedImageTypes.includes(file.type)) {
      setFormError('Choose a JPEG, PNG, or WebP image.')
      return
    }

    if (file.size === 0 || file.size > maxImageSizeBytes) {
      setFormError('The image must be larger than 0 bytes and no more than 5 MB.')
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setUploadSucceeded(false)

    if (!selectedFile) {
      setFormError('Choose an image before uploading.')
      return
    }

    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
      setUploadSucceeded(true)
    } catch (error) {
      // Keep the selected file so the seller can retry without choosing it again.
      setFormError(getApiError(error).message)
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      aria-busy={isUploading}
      className="space-y-4"
    >
      <div>
        <h2 className="text-section-heading font-semibold text-text-primary">Store branding</h2>
        <p className="mt-1 text-supporting text-text-secondary">
          Upload a logo customers can recognize on your public storefront.
        </p>
      </div>

      {formError && (
        <Notification
          title="Logo could not be uploaded"
          message={formError}
          tone="error"
          onDismiss={() => setFormError(null)}
        />
      )}

      {uploadSucceeded && (
        <Notification
          title="Logo updated"
          message="Your storefront logo has been replaced."
          tone="success"
          onDismiss={() => setUploadSucceeded(false)}
        />
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <img
          src={selectedPreviewUrl ?? store.logo?.secureUrl}
          alt={selectedFile ? 'Preview of the selected store logo' : `${store.name} logo`}
          className="size-28 rounded-lg border border-border bg-page object-contain p-2"
        />

        <div className="grid min-w-0 flex-1 gap-2">
          <Label htmlFor="store-logo">{store.logo ? 'Replace logo' : 'Choose a logo'}</Label>
          <input
            id="store-logo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
            onChange={(event) => {
              handleFileChange(event.currentTarget.files?.[0])
              event.currentTarget.value = ''
            }}
            aria-describedby="store-logo-help"
            className="block w-full text-supporting text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-medium file:text-primary"
          />
          <p id="store-logo-help" className="text-supporting text-text-secondary">
            JPEG, PNG, or WebP. Maximum file size: 5 MB.
          </p>
          {selectedFile && (
            <p className="break-all text-supporting text-text-secondary">
              Selected: {selectedFile.name}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isUploading || !selectedFile}>
        {isUploading ? 'Uploading…' : 'Upload logo'}
      </Button>
    </form>
  )
}
