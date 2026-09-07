import type { OrderCategoryEntry } from "@/types/orderDetail";

export interface OrderCategoryLine {
  categoryId: string;
  quantity: number;
  name: string;
  description?: string | null;
}

type OrderCategoriesSource = {
  categories?: unknown;
  category?: unknown;
  quantity?: number | null;
};

function categoryNameFromUnknown(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim();
    if (typeof obj.label === "string" && obj.label.trim()) return obj.label.trim();
    if (typeof obj.id === "string" && obj.id.trim()) return obj.id.trim();
  }
  return null;
}

function lineFromEntry(entry: unknown, fallbackQuantity?: number | null): OrderCategoryLine | null {
  if (!entry || typeof entry !== "object") {
    const name = categoryNameFromUnknown(entry);
    return name ? { categoryId: name, quantity: 1, name } : null;
  }

  const row = entry as Record<string, unknown>;
  const nested = row.category;
  const categoryId =
    typeof row.categoryId === "string"
      ? row.categoryId
      : nested &&
          typeof nested === "object" &&
          typeof (nested as { id?: string }).id === "string"
        ? (nested as { id: string }).id
        : "";

  const qty = Number(row.quantity);
  const name =
    categoryNameFromUnknown(nested) ??
    categoryNameFromUnknown(row) ??
    categoryId;
  if (!name) return null;

  const description =
    nested &&
    typeof nested === "object" &&
    typeof (nested as { description?: string | null }).description === "string"
      ? (nested as { description: string }).description
      : undefined;

  return {
    categoryId: categoryId || name,
    quantity:
      Number.isFinite(qty) && qty > 0
        ? qty
        : typeof fallbackQuantity === "number" && fallbackQuantity > 0
          ? fallbackQuantity
          : 1,
    name,
    description,
  };
}

/** Normalizes single-object, string, or array category fields into line items. */
export function normalizeOrderCategoryLines(
  order: OrderCategoriesSource,
): OrderCategoryLine[] {
  const { categories, category, quantity } = order;

  if (Array.isArray(categories) && categories.length > 0) {
    return categories
      .map((entry) => lineFromEntry(entry))
      .filter((line): line is OrderCategoryLine => line !== null);
  }

  if (category && typeof category === "object" && !Array.isArray(category)) {
    const line = lineFromEntry(category, quantity);
    return line ? [line] : [];
  }

  if (Array.isArray(category)) {
    return category
      .map((entry, index) => {
        const line = lineFromEntry(entry);
        if (!line) return null;
        return {
          ...line,
          categoryId: line.categoryId || `${line.name}-${index}`,
        };
      })
      .filter((line): line is OrderCategoryLine => line !== null);
  }

  if (typeof category === "string" && category.trim()) {
    return [
      {
        categoryId: category,
        quantity: quantity ?? 1,
        name: category,
      },
    ];
  }

  return [];
}

/** Compact label for tables, e.g. "2 × Electronics, 1 × Documents". */
export function formatOrderCategoriesSummary(
  order: OrderCategoriesSource,
  fallback = "—",
): string {
  const lines = normalizeOrderCategoryLines(order);
  if (lines.length === 0) return fallback;
  return lines
    .map((line) =>
      line.quantity > 1 ? `${line.quantity} × ${line.name}` : line.name,
    )
    .join(", ");
}

/** Sum of per-category quantities, with legacy single-quantity fallback. */
export function getOrderCategoriesTotalQuantity(
  order: OrderCategoriesSource,
): number | null {
  const lines = normalizeOrderCategoryLines(order);
  if (lines.length === 0) {
    if (typeof order.quantity === "number" && order.quantity >= 0) {
      return order.quantity;
    }
    return null;
  }
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Unique category names across all lines on an order. */
export function getUniqueOrderCategoryNames(
  order: OrderCategoriesSource,
): string[] {
  return [...new Set(normalizeOrderCategoryLines(order).map((line) => line.name))];
}

export function mapOrderCategoryLinesToForm(
  order: OrderCategoriesSource,
): {
  categoryIds: string[];
  categoryQuantities: Record<string, number>;
} {
  const lines = normalizeOrderCategoryLines(order);
  return {
    categoryIds: lines.map((line) => line.categoryId),
    categoryQuantities: Object.fromEntries(
      lines.map((line) => [line.categoryId, line.quantity]),
    ),
  };
}

export function toOrderCategoryEntries(
  lines: OrderCategoryLine[],
): OrderCategoryEntry[] {
  return lines.map(({ categoryId, quantity, name, description }) => ({
    categoryId,
    quantity,
    category: { id: categoryId, name, description },
  }));
}
