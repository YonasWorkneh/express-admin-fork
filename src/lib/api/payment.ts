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

export interface CouponRecord {
  id: string;
  code?: string;
  creditAmount: number;
  maxOrders: number;
  dueDate: string;
  description?: string | null;
  userId?: string | null;
  corporateId?: string | null;
  remainingOrders?: number;
  usedOrders?: number;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: { id?: string; name?: string; email?: string } | null;
  corporate?: { id?: string; name?: string; companyName?: string } | null;
  [key: string]: unknown;
}

function normalizeCouponList(payload: unknown): CouponRecord[] {
  if (!payload) return [];
  let root: unknown = payload;
  if (
    root &&
    typeof root === "object" &&
    "data" in root &&
    (root as { data: unknown }).data !== undefined
  ) {
    root = (root as { data: unknown }).data;
  }
  if (Array.isArray(root)) {
    return root as CouponRecord[];
  }
  if (root && typeof root === "object") {
    const o = root as Record<string, unknown>;
    const keys = ["coupons", "items", "rows", "results"] as const;
    for (const k of keys) {
      const arr = o[k];
      if (Array.isArray(arr)) return arr as CouponRecord[];
    }
  }
  return [];
}

/** GET /payment/coupons — lists all created credit coupons. */
export async function fetchCoupons(): Promise<CouponRecord[]> {
  const res = await api.get<unknown>("/payment/coupons");
  return normalizeCouponList(res.data);
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

export interface ValidateCouponInput {
  code: string;
  amount: number;
  userId: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  reason?: string;
  remainingCredit?: number;
  remainingOrders?: number;
  /** Top-level API message (e.g. "Credit coupon validation finished"). Prefer `reason` for user-facing validity. */
  message?: string;
}

/** POST /payment/coupons/validate — checks a credit coupon against amount + user. */
export async function validateCoupon(
  input: ValidateCouponInput,
): Promise<ValidateCouponResult> {
  const res = await api.post<{
    data?: {
      valid?: boolean;
      reason?: string;
      remainingCredit?: number;
      remainingOrders?: number;
    };
    message?: string;
    success?: boolean;
  }>("/payment/coupons/validate", input);

  const data = res.data?.data;
  const valid = typeof data?.valid === "boolean" ? data.valid : false;
  const reason =
    typeof data?.reason === "string" && data.reason.trim()
      ? data.reason.trim()
      : undefined;

  return {
    valid,
    reason,
    remainingCredit:
      typeof data?.remainingCredit === "number"
        ? data.remainingCredit
        : undefined,
    remainingOrders:
      typeof data?.remainingOrders === "number"
        ? data.remainingOrders
        : undefined,
    message: res.data?.message,
  };
}
