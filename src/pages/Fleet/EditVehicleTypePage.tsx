import { Navigate, useParams } from "react-router-dom";
import VehicleTypeForm from "@/features/fleet/components/VehicleTypeForm";

export default function EditVehicleTypePage() {
  const { id } = useParams<{ id: string }>();
  if (!id?.trim()) {
    return <Navigate to="/fleet" replace />;
  }
  return <VehicleTypeForm mode="edit" vehicleTypeId={id} />;
}
