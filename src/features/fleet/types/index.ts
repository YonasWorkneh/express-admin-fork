export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  ownership: "In-house" | "External";
  driver: string;
  driverId: string | null;
  status: "Active" | "Maintenance" | "Inactive";
  fuelType: string;
  capacity: string;
  currentMileage: number;
  lastMaintenance: string;
  nextMaintenance: string;
  utilizationRate: number;
  totalTrips: number;
  insurance: "Valid" | "Expiring Soon" | "Expired";
  insuranceExpiry: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  plateNumber: string;
  type: "Scheduled" | "Repair" | "Emergency";
  service: string;
  date: string;
  cost: number;
  mileage: number;
  provider: string;
  status: "Completed" | "In Progress" | "Scheduled";
  technician: string;
  nextService: string | null;
  notes: string;
}

/** Vehicle category / type entity (e.g. van, truck) — matches fleet vehicle-type API */
export interface VehicleType {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleFormValues {
  plateNumber: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  ownership: string;
  driverId: string;
  fuelType: string;
  capacity: string;
  currentMileage: number;
  insuranceNumber: string;
  insuranceProvider: string;
  insuranceExpiry: string;
  registrationDate: string;
  chassisNumber: string;
  engineNumber: string;
  color: string;
  notes: string;
}
