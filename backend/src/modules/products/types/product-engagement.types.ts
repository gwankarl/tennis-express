import type { Types } from 'mongoose';

export const PRODUCT_ENGAGEMENT_EVENT_TYPES = ['view', 'wishlist_add'] as const;

export type ProductEngagementEventType = (typeof PRODUCT_ENGAGEMENT_EVENT_TYPES)[number];

/** A view or wishlist-add activity record used for product popularity. */
export interface ProductEngagementEvent {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  eventType: ProductEngagementEventType;
  /** `user:<id>` for accounts or `visitor:<hash>` for guests. */
  actorKey: string;
  /** UTC date bucket used to deduplicate product views. */
  viewDay?: string;
  occurredAt: Date;
  expiresAt: Date;
}
