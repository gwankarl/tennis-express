import type {
  StoreCollectionOption,
  StoreDeliveryOption,
  StoreRatingSummary,
  StoreReturnPolicy,
} from '../../sellers/store/types/store.types.js';
import type { SellerApplicationFulfilmentDetails } from '../../users/seller-applications/types/seller-application.types.js';

/** Storefront fields intended for public browsing. */
export interface PublicStore {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: {
    region: string;
    city: string;
  };
  logo: {
    secureUrl: string;
  } | null;
  fulfilmentProfile: SellerApplicationFulfilmentDetails | null;
  deliveryOptions: StoreDeliveryOption[];
  collectionOptions: StoreCollectionOption[];
  returnPolicy: StoreReturnPolicy | null;
  ratingSummary: StoreRatingSummary;
}
