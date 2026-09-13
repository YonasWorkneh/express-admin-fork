/** Prefer order.finalPrice; when null/missing, use payment.amount. */
export function getOrderTotalAmount(order: {
  finalPrice?: number | string | null;
  payment?: { amount?: number | string | null } | null;
}): number | null {
  if (order.finalPrice != null && order.finalPrice !== "") {
    const n = Number(order.finalPrice);
    if (Number.isFinite(n)) return n;
  }
  if (order.payment?.amount != null && order.payment.amount !== "") {
    const n = Number(order.payment.amount);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
