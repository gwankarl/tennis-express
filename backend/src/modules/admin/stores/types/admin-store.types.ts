import type {
  Store,
  StoreLocation,
  StoreLogo,
  StoreRatingSummary,
  StoreStatus,
} from '../../../sellers/store/types/store.types.js';

/** Store fields needed for administrative oversight in the store list. */
export interface AdminStoreListItem {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string;
  status: StoreStatus;
  location: Pick<StoreLocation, 'region' | 'city'>;
  logo: Pick<StoreLogo, 'secureUrl'> | null;
  ratingSummary: StoreRatingSummary;
  createdAt: Date;
  updatedAt: Date;
}

/** Store fields needed for administrative review without seller profile data. */
export interface AdminStoreDetails extends Omit<Store, '_id' | 'sellerId' | 'logo'> {
  id: string;
  sellerId: string;
  logo: Pick<StoreLogo, 'secureUrl'> | null;
}
