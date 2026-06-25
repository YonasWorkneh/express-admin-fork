import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/utils/spinner";
import { useStaffDetail } from "@/hooks/useStaffDetail";
import { StaffDetailView } from "@/features/staff/components/StaffDetailView";

export default function StaffDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: staff, isPending, isError, error, refetch } = useStaffDetail(id);

  if (isPending) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Spinner className="h-10 w-10 text-[#EE1E21]" />
      </div>
    );
  }

  if (isError || !staff) {
    return (
      <div className="min-h-screen p-6 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/staff")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to staff
        </Button>
        <p className="mt-6 text-red-600">
          {error?.message ?? "Could not load staff details."}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/staff")}
            className="p-2 rounded-full bg-[#EE1E21]/10 hover:bg-[#EE1E21]/20"
          >
            <ArrowLeft className="h-4 w-4 text-[#EE1E21]" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-[#EE1E21] border-[#EE1E21]/20"
          onClick={() => navigate(`/staff/edit/${staff.id}`)}
        >
          Edit staff
        </Button>
      </div>

      <StaffDetailView staff={staff} />
    </div>
  );
}
