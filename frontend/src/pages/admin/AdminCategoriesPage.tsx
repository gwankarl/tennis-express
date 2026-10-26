import { useState } from 'react'

import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Notification } from '../../components/feedback/Notification'
import { PageHeading } from '../../components/layout/PageHeading'
import { Pagination } from '../../components/ui/Pagination'
import { Button } from '../../components/ui/Button'
import { CategoryForm } from '../../features/admin/categories/components/CategoryForm'
import { CategoryList } from '../../features/admin/categories/components/CategoryList'
import {
  useAdminCategories,
  useCreateAdminCategory,
  useUpdateAdminCategory,
} from '../../features/admin/categories/hooks/useAdminCategories'
import type { Category, CategoryFields } from '../../features/admin/categories/types'
import { getApiError } from '../../lib/apiError'

const pageSize = 20

/** Lets administrators view, create, and update product categories. */
export default function AdminCategoriesPage() {
  const [page, setPage] = useState(1)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [notice, setNotice] = useState<{
    title: string
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  const categoriesQuery = useAdminCategories(page, pageSize)
  const createMutation = useCreateAdminCategory()
  const updateMutation = useUpdateAdminCategory()
  const isSaving = createMutation.isPending || updateMutation.isPending
  const categories = categoriesQuery.data?.categories ?? []

  const openCreateForm = () => {
    setEditingCategory(null)
    setIsCreating(true)
    setNotice(null)
  }

  const openEditForm = (category: Category) => {
    setIsCreating(false)
    setEditingCategory(category)
    setNotice(null)
  }

  const closeForm = () => {
    setIsCreating(false)
    setEditingCategory(null)
  }

  const handleSave = async (fields: CategoryFields, image?: File) => {
    if (editingCategory) {
      await updateMutation.mutateAsync({
        categoryId: editingCategory._id,
        fields,
        image,
      })
      setNotice({
        title: 'Category updated',
        message: 'The category changes have been saved.',
        tone: 'success',
      })
    } else {
      if (!image) {
        throw new Error('Choose an image for the new category.')
      }

      await createMutation.mutateAsync({ fields, image })
      setPage(1)
      setNotice({
        title: 'Category created',
        message: 'The category has been created.',
        tone: 'success',
      })
    }

    closeForm()
  }

  const isFormOpen = isCreating || editingCategory !== null

  return (
    <div className="space-y-6">
      <PageHeading
        title="Categories"
        description="Manage the product category hierarchy and category images."
        action={
          !isFormOpen ? (
            <Button type="button" onClick={openCreateForm}>
              Create category
            </Button>
          ) : undefined
        }
      />

      {notice && (
        <Notification
          title={notice.title}
          message={notice.message}
          tone={notice.tone}
          onDismiss={() => setNotice(null)}
        />
      )}

      {isFormOpen && (
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
          <CategoryForm
            key={editingCategory?._id ?? 'new-category'}
            category={editingCategory}
            categories={categories}
            isSaving={isSaving}
            onCancel={closeForm}
            onSave={handleSave}
          />
        </section>
      )}

      {categoriesQuery.isPending ? (
        <LoadingState label="Loading categories…" />
      ) : categoriesQuery.isError ? (
        <ErrorState
          description={getApiError(categoriesQuery.error).message}
          onRetry={() => void categoriesQuery.refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create a category to start organizing the product catalog."
          action={
            !isFormOpen ? (
              <Button type="button" onClick={openCreateForm}>
                Create category
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <CategoryList categories={categories} onEdit={openEditForm} />
          <Pagination
            currentPage={page}
            pageSize={categoriesQuery.data.pagination.limit}
            totalItems={categoriesQuery.data.pagination.totalItems}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
