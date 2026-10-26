import { useState, type FormEvent } from 'react'
import { z } from 'zod'

import { Notification } from '../../../../components/feedback/Notification'
import { Button } from '../../../../components/ui/Button'
import { FormField } from '../../../../components/ui/FormField'
import { Label } from '../../../../components/ui/Label'
import { getApiError } from '../../../../lib/apiError'
import type { Category, CategoryAttribute, CategoryFields } from '../types'

const maxImageSizeBytes = 5 * 1024 * 1024
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

const attributeSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    type: z.enum(['text', 'number', 'boolean', 'select']),
    required: z.boolean().default(false),
    filterable: z.boolean().default(false),
    options: z.array(z.string().trim().min(1).max(100)).default([]),
  })
  .superRefine((attribute, context) => {
    if (attribute.type === 'select' && attribute.options.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Select attributes need at least one option.',
      })
    }

    if (attribute.type !== 'select' && attribute.options.length > 0) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Only select attributes can have options.',
      })
    }
  })

const attributesSchema = z.array(attributeSchema).max(50)

interface CategoryFormProps {
  category: Category | null
  categories: Category[]
  isSaving: boolean
  onCancel: () => void
  onSave: (fields: CategoryFields, image?: File) => Promise<void>
}

function getInitialFields(category: Category | null): CategoryFields {
  return {
    name: category?.name ?? '',
    parentId: category?.parentId ?? null,
    description: category?.description ?? null,
    attributes: category?.attributes ?? [],
    status: category?.status ?? 'active',
    sortOrder: category?.sortOrder ?? 0,
  }
}

/** Creates or edits category fields and uploads the required or replacement image. */
export function CategoryForm({
  category,
  categories,
  isSaving,
  onCancel,
  onSave,
}: CategoryFormProps) {
  const initialFields = getInitialFields(category)
  const [name, setName] = useState(initialFields.name)
  const [parentId, setParentId] = useState(initialFields.parentId ?? '')
  const [description, setDescription] = useState(initialFields.description ?? '')
  const [status, setStatus] = useState<CategoryFields['status']>(initialFields.status)
  const [sortOrder, setSortOrder] = useState(String(initialFields.sortOrder))
  const [attributesText, setAttributesText] = useState(
    JSON.stringify(initialFields.attributes, null, 2),
  )
  const [image, setImage] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    let attributes: CategoryAttribute[]

    try {
      const parsedAttributes: unknown = JSON.parse(attributesText)
      const result = attributesSchema.safeParse(parsedAttributes)

      if (!result.success) {
        setFormError(result.error.issues[0]?.message ?? 'Check the category attributes.')
        return
      }

      attributes = result.data
    } catch {
      setFormError('Attributes must be valid JSON.')
      return
    }

    const parsedSortOrder = Number(sortOrder)

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0 || parsedSortOrder > 1_000_000) {
      setFormError('Sort order must be a whole number from 0 to 1,000,000.')
      return
    }

    if (!category && !image) {
      setFormError('Choose an image for the new category.')
      return
    }

    const fields: CategoryFields = {
      name: name.trim(),
      parentId: parentId || null,
      description: description.trim() || null,
      attributes,
      status,
      sortOrder: parsedSortOrder,
    }

    try {
      await onSave(fields, image ?? undefined)
    } catch (error) {
      setFormError(getApiError(error).message)
    }
  }

  const handleImageChange = (file: File | undefined) => {
    setFormError(null)
    setImage(null)

    if (!file) return

    if (!allowedImageTypes.includes(file.type)) {
      setFormError('Choose a JPEG, PNG, or WebP image.')
      return
    }

    if (file.size === 0 || file.size > maxImageSizeBytes) {
      setFormError('The image must be larger than 0 bytes and no more than 5 MB.')
      return
    }

    setImage(file)
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      <h2 className="text-section-heading font-semibold text-text-primary">
        {category ? 'Edit category' : 'Create category'}
      </h2>

      {formError && (
        <Notification
          title="Category could not be saved"
          message={formError}
          tone="error"
          onDismiss={() => setFormError(null)}
        />
      )}

      <FormField
        id="category-name"
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={120}
      />

      <div className="grid gap-1.5">
        <Label htmlFor="category-parent">Parent category</Label>
        <select
          id="category-parent"
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">No parent</option>
          {categories
            .filter((item) => item._id !== category?._id)
            .map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="category-description">Description</Label>
        <textarea
          id="category-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full rounded-md border border-border bg-surface p-3 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="category-attributes">Attributes (JSON)</Label>
        <textarea
          id="category-attributes"
          value={attributesText}
          onChange={(event) => setAttributesText(event.target.value)}
          rows={8}
          spellCheck={false}
          aria-describedby="category-attributes-help"
          className="w-full rounded-md border border-border bg-surface p-3 font-mono text-supporting text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <p id="category-attributes-help" className="text-supporting text-text-secondary">
          Use an array of attribute objects. Select attributes require options.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="category-status">Status</Label>
        <select
          id="category-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as CategoryFields['status'])}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <FormField
        id="category-sort-order"
        label="Sort order"
        type="number"
        min={0}
        max={1_000_000}
        step={1}
        value={sortOrder}
        onChange={(event) => setSortOrder(event.target.value)}
        required
      />

      <div className="grid gap-1.5">
        <Label htmlFor="category-image">{category ? 'Replace image' : 'Image'}</Label>
        <input
          id="category-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isSaving}
          onChange={(event) => {
            handleImageChange(event.currentTarget.files?.[0])
            event.currentTarget.value = ''
          }}
          className="block w-full text-supporting text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-medium file:text-primary"
        />
        <p className="text-supporting text-text-secondary">
          JPEG, PNG, or WebP; maximum file size 5 MB.
          {category ? ' Leave empty to keep the current image.' : ' Required.'}
        </p>

        {category && (
          <img
            src={category.image.secureUrl}
            alt={`${category.name} category`}
            className="mt-2 size-24 rounded-lg border border-border object-cover"
          />
        )}
        {image && (
          <p className="break-all text-supporting text-text-secondary">Selected: {image.name}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : category ? 'Save changes' : 'Create category'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
