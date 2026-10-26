import { useQuery } from '@tanstack/react-query'

import { getPublicStore } from '../api/publicStores'

/** Loads one active public storefront using its URL slug. */
export function usePublicStore(slug: string) {
  return useQuery({
    queryKey: ['public', 'stores', slug],
    queryFn: () => getPublicStore(slug),
    enabled: slug.length > 0,
  })
}
