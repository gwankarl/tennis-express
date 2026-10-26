import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../api/adminCategories'

export const adminCategoriesQueryKey = ['admin', 'categories'] as const

export function useAdminCategories(page: number, limit: number) {
  return useQuery({
    queryKey: [...adminCategoriesQueryKey, 'list', page, limit],
    queryFn: () => getAdminCategories(page, limit),
  })
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdminCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey })
    },
  })
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey })
    },
  })
}
