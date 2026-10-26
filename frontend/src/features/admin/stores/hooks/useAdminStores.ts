import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getAdminStore, getAdminStores, updateAdminStoreStatus } from '../api/adminStores'
import type { AdminStoreListQuery } from '../types'

export const adminStoresQueryKey = ['admin', 'stores'] as const

/** Fetches a paginated store list using the selected filters. */
export function useAdminStores(query: AdminStoreListQuery) {
  return useQuery({
    queryKey: [...adminStoresQueryKey, 'list', query],
    queryFn: () => getAdminStores(query),
  })
}

/** Fetches the full administrative record for the selected store. */
export function useAdminStore(storeId: string | null) {
  return useQuery({
    queryKey: [...adminStoresQueryKey, 'detail', storeId],
    queryFn: () => getAdminStore(storeId as string),
    enabled: Boolean(storeId),
  })
}

/** Changes store status and refreshes cached store lists and details. */
export function useUpdateAdminStoreStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminStoreStatus,
    onSuccess: async (store) => {
      queryClient.setQueryData([...adminStoresQueryKey, 'detail', store.id], store)

      await queryClient.invalidateQueries({
        queryKey: adminStoresQueryKey,
      })
    },
  })
}
