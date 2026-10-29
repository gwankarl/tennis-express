import type { Types } from 'mongoose';

/** Contact and location details shared by saved and one-time addresses. */
export interface AddressDetails {
  recipientName: string;
  phone: string;
  region: string;
  city: string;
  neighborhood: string;
  street: string;
  deliveryInstructions: string | null;
}

/** A saved address owned by one user. */
export interface CustomerAddress extends AddressDetails {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Public response shape for one saved address; does not expose its owner ID. */
export interface CustomerAddressView extends AddressDetails {
  id: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
