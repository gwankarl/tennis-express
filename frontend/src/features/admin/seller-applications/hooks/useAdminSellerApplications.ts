import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveAdminApplication,
  getAdminApplication,
  getAdminApplications,
  rejectAdminApplication,
  type AdminApplicationListQuery,
} from '../api/adminSellerApplications'

export const adminSellerApplicationsQueryKey = ['admin', 'seller-applications'] as const

export function useAdminApplications(query: AdminApplicationListQuery) {
  return useQuery({
    queryKey: [...adminSellerApplicationsQueryKey, 'list', query],
    queryFn: () => getAdminApplications(query),
  })
}

export function useAdminApplication(applicationId: string | null) {
  return useQuery({
    queryKey: [...adminSellerApplicationsQueryKey, 'detail', applicationId],
    queryFn: () => getAdminApplication(applicationId as string),
    enabled: Boolean(applicationId),
  })
}

export function useApproveAdminApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveAdminApplication,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminSellerApplicationsQueryKey,
      })
    },
  })
}

export function useRejectAdminApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason: string }) =>
      rejectAdminApplication(applicationId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminSellerApplicationsQueryKey,
      })
    },
  })
}
