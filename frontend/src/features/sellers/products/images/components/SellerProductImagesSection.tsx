import { useEffect, useRef, useState, type FormEvent } from 'react'

import { ErrorState } from '../../../../../components/feedback/ErrorState'
import { LoadingState } from '../../../../../components/feedback/LoadingState'
import { Notification } from '../../../../../components/feedback/Notification'
import { Button } from '../../../../../components/ui/Button'
import { Dialog } from '../../../../../components/ui/Dialog'
import { getApiError } from '../../../../../lib/apiError'
import {
  useDeleteSellerProductImage,
  useReorderSellerProductImages,
  useSellerProductImages,
  useUpdateSellerProductImage,
  useUploadSellerProductImage,
} from '../hooks/useSellerProductImages'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

interface PendingImageUpload {
  file: File
  previewUrl: string
}

interface UploadProgress {
  completed: number
  total: number
}

interface SellerProductImagesSectionProps {
  productId: string
  productName?: string
}

function getFileKey(file: File): string {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}`
}

/** Uploads and manages the images belonging to a seller-owned product. */
export function SellerProductImagesSection({
  productId,
  productName,
}: SellerProductImagesSectionProps) {
  const [selectedUploads, setSelectedUploads] = useState<PendingImageUpload[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isUploadingBatch, setIsUploadingBatch] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [imageToDelete, setImageToDelete] = useState<{
    id: string
    altText: string
  } | null>(null)

  const previewUrls = useRef(new Set<string>())

  const imagesQuery = useSellerProductImages(productId)
  const uploadMutation = useUploadSellerProductImage(productId)
  const updateMutation = useUpdateSellerProductImage(productId)
  const reorderMutation = useReorderSellerProductImages(productId)
  const deleteMutation = useDeleteSellerProductImage(productId)

  const images = imagesQuery.data ?? []
  const isMutating =
    isUploadingBatch ||
    uploadMutation.isPending ||
    updateMutation.isPending ||
    reorderMutation.isPending ||
    deleteMutation.isPending

  useEffect(() => {
    const urlsToRevoke = previewUrls.current

    return () => {
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url))
      urlsToRevoke.clear()
    }
  }, [])

  const handleFilesChange = (fileList: FileList | null) => {
    setFormError(null)
    setActionError(null)
    setSuccessMessage(null)

    const files = Array.from(fileList ?? [])
    const validFiles: File[] = []
    const skippedFiles: string[] = []
    const knownFileKeys = new Set(selectedUploads.map(({ file }) => getFileKey(file)))

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        skippedFiles.push(`${file.name}: use JPEG, PNG, or WebP.`)
        continue
      }

      if (file.size === 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
        skippedFiles.push(
          `${file.name}: the file must be larger than 0 bytes and no larger than 5 MB.`,
        )
        continue
      }

      const fileKey = getFileKey(file)

      if (knownFileKeys.has(fileKey)) {
        skippedFiles.push(`${file.name}: already selected.`)
        continue
      }

      knownFileKeys.add(fileKey)
      validFiles.push(file)
    }

    const newUploads = validFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      previewUrls.current.add(previewUrl)
      return { file, previewUrl }
    })

    setSelectedUploads((currentUploads) => [...currentUploads, ...newUploads])

    if (skippedFiles.length > 0) {
      setFormError(
        `${skippedFiles.length} file(s) were skipped. ${skippedFiles.slice(0, 3).join(' ')}`,
      )
    }
  }

  const handleRemoveSelectedUpload = (index: number) => {
    const removedUpload = selectedUploads[index]

    if (removedUpload) {
      previewUrls.current.delete(removedUpload.previewUrl)
      URL.revokeObjectURL(removedUpload.previewUrl)
    }

    setSelectedUploads((currentUploads) =>
      currentUploads.filter((_, currentIndex) => currentIndex !== index),
    )
  }

  const handleCancelUploads = () => {
    if (isUploadingBatch) return

    previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrls.current.clear()

    setSelectedUploads([])
    setFormError(null)
    setActionError(null)
    setSuccessMessage(null)
  }

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setActionError(null)
    setSuccessMessage(null)

    if (selectedUploads.length === 0) {
      setFormError('Choose at least one image to upload.')
      return
    }

    const failedUploads: PendingImageUpload[] = []
    let firstUploadError: string | null = null
    let uploadedCount = 0

    setIsUploadingBatch(true)
    setUploadProgress({ completed: 0, total: selectedUploads.length })

    try {
      for (const [index, upload] of selectedUploads.entries()) {
        try {
          await uploadMutation.mutateAsync({ file: upload.file })
          previewUrls.current.delete(upload.previewUrl)
          URL.revokeObjectURL(upload.previewUrl)
          uploadedCount += 1
        } catch (error) {
          failedUploads.push(upload)
          firstUploadError ??= getApiError(error).message
        }

        setUploadProgress({
          completed: index + 1,
          total: selectedUploads.length,
        })
      }
    } finally {
      setIsUploadingBatch(false)
      setUploadProgress(null)
    }

    setSelectedUploads(failedUploads)

    if (failedUploads.length === 0) {
      setSuccessMessage(
        uploadedCount === 1 ? 'Image uploaded.' : `${uploadedCount} images uploaded.`,
      )
      event.currentTarget.reset()
      return
    }

    if (uploadedCount > 0) {
      setSuccessMessage(`${uploadedCount} image(s) uploaded. Failed files remain selected.`)
    }

    setActionError(
      `Could not upload ${failedUploads.length} image(s). ${firstUploadError ?? 'Try again.'}`,
    )
  }

  const handleSetPrimary = async (imageId: string) => {
    setActionError(null)
    setSuccessMessage(null)

    try {
      await updateMutation.mutateAsync({
        imageId,
        changes: { isPrimary: true },
      })
      setSuccessMessage('Primary image updated.')
    } catch (error) {
      setActionError(getApiError(error).message)
    }
  }

  const handleReorderImages = async (fromIndex: number, toIndex: number) => {
    if (
      isMutating ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= images.length ||
      toIndex >= images.length ||
      fromIndex === toIndex
    ) {
      return
    }

    const reorderedImages = [...images]
    ;[reorderedImages[fromIndex], reorderedImages[toIndex]] = [
      reorderedImages[toIndex],
      reorderedImages[fromIndex],
    ]

    setActionError(null)
    setSuccessMessage(null)

    try {
      await reorderMutation.mutateAsync({
        imageIds: reorderedImages.map((image) => image._id),
      })
      setSuccessMessage('Image order updated.')
    } catch (error) {
      setActionError(getApiError(error).message)
    }
  }

  const handleDeleteImage = async () => {
    if (!imageToDelete) return

    setActionError(null)
    setSuccessMessage(null)

    try {
      await deleteMutation.mutateAsync(imageToDelete.id)
      setSuccessMessage('Image deleted.')
      setImageToDelete(null)
    } catch (error) {
      setActionError(getApiError(error).message)
      setImageToDelete(null)
    }
  }

  if (imagesQuery.isPending) {
    return <LoadingState label="Loading product images..." />
  }

  if (imagesQuery.isError) {
    return (
      <ErrorState
        description={getApiError(imagesQuery.error).message}
        onRetry={() => void imagesQuery.refetch()}
      />
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-section-heading font-semibold text-text-primary">Product images</h2>
        <p className="mt-1 text-supporting text-text-secondary">
          Upload clear product photos. Choose one primary image and arrange the order customers will
          see.
        </p>
      </div>

      {actionError && (
        <Notification
          title="Image action failed"
          message={actionError}
          tone="error"
          onDismiss={() => setActionError(null)}
        />
      )}

      {successMessage && (
        <Notification
          title="Images updated"
          message={successMessage}
          tone="success"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      <form
        onSubmit={(event) => void handleUpload(event)}
        className="space-y-4 rounded-xl border border-border bg-surface p-4"
        aria-busy={isUploadingBatch}
      >
        <h3 className="text-card-heading font-semibold text-text-primary">Add images</h3>

        {formError && (
          <Notification
            title="Check the selected files"
            message={formError}
            tone="error"
            onDismiss={() => setFormError(null)}
          />
        )}

        <label className="grid gap-2 text-form-label font-medium text-text-secondary">
          Select images
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isMutating}
            onChange={(event) => {
              handleFilesChange(event.currentTarget.files)
              event.currentTarget.value = ''
            }}
            className="block min-h-11 w-full rounded-md border border-border bg-surface p-2 text-supporting text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-medium file:text-primary"
          />
          <span className="text-supporting font-normal">
            Select multiple JPEG, PNG, or WebP images. Each file can be up to 5 MB. Alt text is
            generated by the server from the product name and filename.
          </span>
        </label>

        {selectedUploads.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedUploads.map((upload, index) => (
              <li
                key={`${upload.file.name}-${upload.file.lastModified}-${index}`}
                className="flex min-w-0 items-center gap-3 rounded-lg bg-page p-3"
              >
                <img
                  src={upload.previewUrl}
                  alt={`Preview of ${upload.file.name}`}
                  className="size-16 shrink-0 rounded-md bg-surface object-contain"
                />
                <span className="min-w-0 flex-1 break-all text-supporting text-text-secondary">
                  {upload.file.name}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  disabled={isMutating}
                  aria-label={`Remove ${upload.file.name}`}
                  onClick={() => handleRemoveSelectedUpload(index)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}

        {uploadProgress && (
          <p role="status" aria-live="polite" className="text-supporting text-text-secondary">
            Uploading image {uploadProgress.completed} of {uploadProgress.total}...
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          {selectedUploads.length > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={isUploadingBatch}
              onClick={handleCancelUploads}
            >
              Cancel selection
            </Button>
          )}

          <Button type="submit" disabled={isMutating || selectedUploads.length === 0}>
            {isUploadingBatch ? 'Uploading...' : 'Upload selected images'}
          </Button>
        </div>
      </form>

      {images.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-body text-text-secondary">
          No images have been uploaded yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image._id}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(event) => {
                event.preventDefault()

                const sourceId = event.dataTransfer.getData('text/plain')
                const fromIndex = images.findIndex((candidate) => candidate._id === sourceId)

                void handleReorderImages(fromIndex, index)
                setDraggedImageId(null)
              }}
              className={[
                'overflow-hidden rounded-xl border border-border bg-surface',
                draggedImageId === image._id ? 'opacity-50' : '',
              ].join(' ')}
            >
              <div className="relative aspect-square bg-page">
                <img
                  src={image.secureUrl}
                  alt={image.altText || productName || 'Product image'}
                  className="size-full object-contain"
                />
                {image.isPrimary && (
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-supporting font-medium text-surface">
                    Primary
                  </span>
                )}
              </div>

              <div className="space-y-3 p-4">
                <p className="wrap-break-word text-supporting text-text-secondary">
                  {image.altText}
                </p>

                <div className="flex flex-wrap gap-2">
                  {!image.isPrimary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      disabled={isMutating}
                      onClick={() => void handleSetPrimary(image._id)}
                    >
                      Make primary
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="small"
                    draggable={!isMutating}
                    disabled={isMutating}
                    aria-label={`Reorder ${image.altText}`}
                    aria-describedby="image-reorder-instructions"
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', image._id)
                      event.dataTransfer.effectAllowed = 'move'
                      setDraggedImageId(image._id)
                    }}
                    onDragEnd={() => setDraggedImageId(null)}
                    onKeyDown={(event) => {
                      if (!event.altKey) return

                      if (event.key === 'ArrowUp') {
                        event.preventDefault()
                        void handleReorderImages(index, index - 1)
                      } else if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        void handleReorderImages(index, index + 1)
                      }
                    }}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <span aria-hidden="true">⠿</span>
                    Drag to reorder
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="small"
                    disabled={isMutating || (image.isPrimary && images.length > 1)}
                    onClick={() => setImageToDelete({ id: image._id, altText: image.altText })}
                  >
                    Delete
                  </Button>
                </div>

                {image.isPrimary && images.length > 1 && (
                  <p className="text-supporting text-text-secondary">
                    Choose another primary image before deleting this one.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={imageToDelete !== null}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setImageToDelete(null)
        }}
        title="Delete product image?"
        description={
          imageToDelete
            ? `This will remove "${imageToDelete.altText}" from this product.`
            : undefined
        }
      >
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={deleteMutation.isPending}
            onClick={() => setImageToDelete(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => void handleDeleteImage()}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete image'}
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
