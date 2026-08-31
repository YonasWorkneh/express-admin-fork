import api from "./api";

export type PaymentMethodApi =
  | "CASH"
  | "BANK_TRANSFER"
  | "CHECK"
  | "CREDIT"
  | "CASH_ON_DELIVERY";

export interface CashPaymentInput {
  method: "CASH";
  amount: number;
  currency: string;
  receivedById: string;
  receivedByName: string;
  receiptNumber: string;
}

export interface BankTransferPaymentInput {
  method: "BANK_TRANSFER";
  amount: number;
  currency: string;
  bankName: string;
  referenceNumber: string;
  accountName: string;
  accountNumber: string;
  depositedAt: string;
}

export interface CheckPaymentInput {
  method: "CHECK";
  amount: number;
  currency: string;
  bankName: string;
  checkNumber: string;
  checkIssueDate: string;
  checkDueDate: string;
  payerName: string;
}

export interface CreditPaymentInput {
  method: "CREDIT";
  amount: number;
  currency: string;
  couponCode: string;
}

export interface CashOnDeliveryPaymentInput {
  method: "CASH_ON_DELIVERY";
  amount: number;
  currency: string;
}

export type CreatePaymentInput =
  | CashPaymentInput
  | BankTransferPaymentInput
  | CheckPaymentInput
  | CreditPaymentInput
  | CashOnDeliveryPaymentInput;

export interface PaymentRecord {
  id: string;
  method: PaymentMethodApi;
  amount: number;
  currency: string;
  [key: string]: unknown;
}

/** POST /payment — records the payment; the returned id is attached to the order as `paymentId`. */
export async function createPayment(
  input: CreatePaymentInput,
): Promise<PaymentRecord> {
  const res = await api.post<{ data?: PaymentRecord; message?: string }>(
    "/payment",
    input,
  );
  const record = res.data?.data;
  if (!record?.id) {
    throw new Error("Payment was not created.");
  }
  return record;
}

export type CouponScope = "CORPORATE" | "INDIVIDUAL";

export interface CreateCouponInput {
  creditAmount: number;
  maxOrders: number;
  dueDate: string;
  description?: string;
  userId?: string;
  corporateId?: string;
}

export interface CouponRecord extends CreateCouponInput {
  id: string;
  code?: string;
  [key: string]: unknown;
}

/** POST /payment/coupons — creates a coupon for the CREDIT payment method to redeem later. */
export async function createCoupon(
  input: CreateCouponInput,
): Promise<CouponRecord> {
  const res = await api.post<{ data?: CouponRecord; message?: string }>(
    "/payment/coupons",
    input,
  );
  const record = res.data?.data;
  if (!record?.id) {
    throw new Error("Coupon was not created.");
  }
  return record;
}
