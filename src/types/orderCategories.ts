/** Order item category from GET/POST /order/item-categories */
export interface OrderItemCategory {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderItemCategoryInput {
  name: string;
  description?: string;
}
