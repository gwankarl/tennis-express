import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  saveSellerApplication,
  // sellerApplicationHistoryQueryKey,
  type SellerApplicationUpload,
} from '../api/sellerApplications'

interface SaveSellerApplicationVariables extends SellerApplicationUpload {
  rejectedApplicationId?: string
}

/** Saves a new application or resubmits the selected rejected application. */
export function useSaveSellerApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ rejectedApplicationId, ...upload }: SaveSellerApplicationVariables) =>
      saveSellerApplication(upload, rejectedApplicationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['seller-applications'] })
    },
  })
}
