import Shipment from "../features/dashboard/components/Shipment";
import Revenue from "../features/dashboard/components/Revenue";
import Rating from "../features/dashboard/components/Rating";
import Performance from "../features/dashboard/components/Performance";
import Agent from "../features/dashboard/components/Agent";
import { COMPANY_LOGO_SRC, COMPANY_NAME } from "@/constants/company";
import { useAuthState } from "@/hooks/useAuthState";

const Dashboard = () => {
  const { user } = useAuthState();

  return (
    <div className="font-text">
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white mb-6">
        <div className="bg-gradient-to-r from-[#FADF4B] to-[#f2c94c] px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={COMPANY_LOGO_SRC} alt={COMPANY_NAME} className="h-12 w-auto" />
            <div>
              <p className="text-xs font-semibold text-[#8a1a1c] uppercase tracking-wide">
                {COMPANY_NAME}
              </p>
              <p className="text-sm font-medium text-[#8a1a1c]">
                Dashboard Overview
              </p>
            </div>
          </div>
          {user?.name && (
            <p className="text-sm font-medium text-[#8a1a1c]">
              Welcome back, {user.name}
            </p>
          )}
        </div>
        <div className="h-1 bg-[#EE1E21]" />
      </div>

      <Shipment />
      <div className="flex">
        <div className="w-3/4">
          <Revenue />
        </div>
        <div className="w-1/4">
          <Rating />
        </div>
      </div>
      <Performance />
      <Agent />
    </div>
  );
};

export default Dashboard;
