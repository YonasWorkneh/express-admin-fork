import api from "@/lib/api/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getUserFacingApiError } from "@/utils/apiErrorMessage";
import {  FaCheckCircle, FaClock, FaTimesCircle, FaUserTie, FaTruckMonster, FaBuilding, FaClipboardList } from "react-icons/fa";

const Shipment = () => {
  interface DashboardSummary {
    totalOrders: number;
    completed: number;
    pending: number;
    failed: number;
    pendingDrivers: number;
  }
  
  interface DashboardResponse {
    summary: DashboardSummary;
    logistics: {
      totalDrivers: number;
      totalVehicles: number;
      totalBranches: number;
    };
    revenue: {
      total: number;
    };
    meta: { generatedAt: string };
  }
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  console.log(loading)

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: DashboardResponse }>("/report/dashboard/overview");
      setDashboard(res.data.data);
    } catch (error: unknown) {
      toast.error(getUserFacingApiError(error));
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{
    fetchDashboard()
  },[])
  useEffect(() => {
    if (dashboard) {
      const { summary, logistics } = dashboard;
  
      setStats([
        {
          title: "Total Orders",
          value: summary.totalOrders.toLocaleString(),
          change: "+0%", // you can adjust once backend gives change %
          changeColor: "text-blue-600",
          changeBg: "bg-blue-100",
          extra: "All orders recorded",
          icon: <FaClipboardList className="text-blue-600" />,
        },
        {
          title: "Completed",
          value: summary.completed.toLocaleString(),
          change: "+0%",
          changeColor: "text-green-600",
          changeBg: "bg-green-100",
          extra: "Successfully delivered",
          icon: <FaCheckCircle className="text-green-600" />,
        },
        {
          title: "Pending",
          value: summary.pending.toLocaleString(),
          change: "-0%",
          changeColor: "text-yellow-600",
          changeBg: "bg-yellow-100",
          extra: "Orders waiting processing",
          icon: <FaClock className="text-yellow-600" />,
        },
        {
          title: "Failed",
          value: summary.failed.toLocaleString(),
          change: "-0%",
          changeColor: "text-red-600",
          changeBg: "bg-red-100",
          extra: "Orders not delivered",
          icon: <FaTimesCircle className="text-red-600" />,
        },
        {
          title: "Total Drivers",
          value: logistics.totalDrivers.toLocaleString(),
          change: "+0%",
          changeColor: "text-purple-600",
          changeBg: "bg-purple-100",
          extra: "Available drivers",
          icon: <FaUserTie className="text-purple-600" />,
        },
        {
          title: "Pending Drivers",
          value: summary.pendingDrivers.toLocaleString(),
          change: "+0%",
          changeColor: "text-orange-600",
          changeBg: "bg-orange-100",
          extra: "Pending drivers",
          icon: <FaUserTie className="text-orange-600" />,
        },
        {
          title: "Total Vehicles",
          value: logistics.totalVehicles.toLocaleString(),
          change: "+0%",
          changeColor: "text-indigo-600",
          changeBg: "bg-indigo-100",
          extra: "Vehicles in operation",
          icon: <FaTruckMonster className="text-indigo-600" />,
        },
        {
          title: "Branches",
          value: logistics.totalBranches.toLocaleString(),
          change: "+0%",
          changeColor: "text-orange-600",
          changeBg: "bg-orange-100",
          extra: "Active branches",
          icon: <FaBuilding className="text-orange-600" />,
        },
       
      ]);
    }
  }, [dashboard]);
  
  // const stats = [
  //   {
  //     title: "Active",
  //     value: "3,120",
  //     change: "+5.6%",
  //     changeColor: "text-blue-500",
  //     changeBg: "bg-blue-100",
  //     extra: "Currently in transit",
  //     icon: <FaTruck className="text-blue-500" />,
  //   },
  //   {
  //     title: "Delivered",
  //     value: "8,900",
  //     change: "+9.8%",
  //     changeColor: "text-green-600",
  //     changeBg: "bg-green-100",
  //     extra: "Delivered successfully this year",
  //     icon: <FaCheckCircle className="text-green-600" />,
  //   },
  //   {
  //     title: "Delayed",
  //     value: "320",
  //     change: "-2.4%",
  //     changeColor: "text-yellow-600",
  //     changeBg: "bg-yellow-100",
  //     extra: "Shipments delayed this year",
  //     icon: <FaClock className="text-yellow-600" />,
  //   },
  //   {
  //     title: "Canceled",
  //     value: "110",
  //     change: "-1.2%",
  //     changeColor: "text-red-600",
  //     changeBg: "bg-red-100",
  //     extra: "Shipments canceled this year",
  //     icon: <FaTimesCircle className="text-red-600" />,
  //   },
  // ];

  return (
    <div className="font-text">
      <p className="pb-4 text-base font-semibold">Total Shipment</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 border border-gray"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{stat.title}</p>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${stat.changeBg} ${stat.changeColor}`}
              >
                {stat.change}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {stat.value}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {stat.icon}
              <span>{stat.extra}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray rounded-lg shadow p-6 text-black mt-6 ">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h3 className="text-base mb-2">Shipment Performance Summary</h3>
          </div>
          <button className="mt-4 md:mt-0 px-6 py-2 bg-[#EE1E21] text-sm cursor-pointer text-[#FADF4B] rounded-full">
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shipment;
