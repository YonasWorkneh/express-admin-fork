/** Service type from GET/POST/PATCH /orders/service-types */
export interface ServiceType {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceTypeInput {
  name: string;
  description: string;
}

export interface UpdateServiceTypeInput {
  name: string;
  description: string;
}
