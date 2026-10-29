import type { Store } from '../../sellers/store/types/store.types.js';
import type { PublicStore } from '../types/public-store.types.js';

/** Maps a store document to the fields exposed by the public API. */
export function mapPublicStore(store: Store): PublicStore {
  return {
    id: store._id.toString(),
    name: store.name,
    slug: store.slug,
    description: store.description,
    location: {
      region: store.location.region,
      city: store.location.city,
    },
    logo: store.logo ? { secureUrl: store.logo.secureUrl } : null,
    fulfilmentProfile: store.fulfilmentProfile,
    deliveryOptions: store.deliveryOptions,
    collectionOptions: store.collectionOptions,
    returnPolicy: store.returnPolicy,
    ratingSummary: store.ratingSummary,
  };
}
