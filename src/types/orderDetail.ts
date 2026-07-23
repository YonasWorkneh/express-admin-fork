/**
 * GET /order/:id — `data` object shape (nested relations from backend).
 */

export interface OrderDetailCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface OrderDetailServiceType {
  id: string;
  name: string;
}

export interface OrderTrackingEntry {
  id: string;
  orderId?: string;
  status: string;
  location?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedBy?: string | null;
}

export interface OrderDetailAddress {
  id: string;
  label?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  createdAt?: string;
  landMark?: string | null;
  lat?: string | null;
  long?: string | null;
}

export interface OrderDetailPerson {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface OrderPriceLog {
  id: string;
  orderId: string;
  weight?: number | null;
  distance?: number | null;
  baseRate?: number | null;
  appliedRate?: number | null;
  surcharges?: number | null;
  discounts?: number | null;
  miscFees?: number | null;
  profit?: number | null;
  airportFee?: number | null;
  finalPrice: number;
  currency?: string | null;
  createdAt: string;
  createdBy?: string | null;
  vat?: number | null;
  amountToPay?: number | null;
  walletUsed?: number | null;
  pickupDistance?: number | null;
  dropoffDistance?: number | null;
  pickupPrice?: number | null;
  dropoffPrice?: number | null;
}

export interface OrderDetailApi {
  id: string;
  trackingCode: string;
  status: string;
  weight: number;
  finalPrice: number;
  /** Optional — used when prefilling accept-dropoff flow */
  vehicleTypeId?: string | null;
  unusualReason?: string | null;
  validatedNotes?: string | null;
  branch?: { id: string; name?: string; location?: string | null } | null;
  cost?: number;
  currency?: string;
  shipmentType?: string;
  shippingScope?: string;
  fulfillmentType?: string;
  isFragile: boolean;
  isDelivery?: boolean;
  isUnusual?: boolean;
  quantity?: number;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  pickupDate?: string;
  deliveryDate?: string;
  distance?: number;
  estimatedDistance?: number;
  estimatedPrice?: number;
  estimatedDeliveryAt?: string | null;
  actualDeliveryAt?: string | null;
  notes?: string | null;
  customer?: OrderDetailPerson;
  receiver?: OrderDetailPerson;
  category?: OrderDetailCategory | null;
  serviceType?: OrderDetailServiceType | string | null;
  pickupAddress?: OrderDetailAddress | null;
  deliveryAddress?: OrderDetailAddress | null;
  orderTracking?: OrderTrackingEntry[];
  originCityRaw?: string | null;
  destinationCityRaw?: string | null;
  pickupDriverId?: string | null;
  deliveryDriverId?: string | null;
  pickupDriver?: { id: string; name?: string } | null;
  deliveryDriver?: { id: string; name?: string } | null;
  priceLogs?: OrderPriceLog | OrderPriceLog[] | null;
}
