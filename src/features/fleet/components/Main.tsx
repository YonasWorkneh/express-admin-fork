import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import {
  IoAdd,
  IoCarSport,
  IoConstruct,
  IoSpeedometer,
  IoBan,
  IoCheckmarkCircle,
  IoWarning,
  IoSearch,
  IoFilter,
  IoDownload,
} from "react-icons/io5";
import { MdEdit, MdDelete } from "react-icons/md";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FleetListResponse, FleetVehicle, Pagination } from "@/types/types";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/common/DeleteModal";
import { Skeleton } from "antd";
import { Spinner } from "@/utils/spinner";
import { exportToExcel } from "@/utils/exportToExcel";
import { cn } from "@/lib/utils";
import FleetTypesList from "./FleetTypesList";

function isInternalFleetOwnership(t: unknown): boolean {
  const s = String(t ?? "").trim();
  const u = s.toUpperCase().replace(/[\s-]+/g, "_");
  return (
    u === "INTERNAL" ||
    u === "INHOUSE" ||
    u === "IN_HOUSE" ||
    s.toLowerCase() === "inhouse" ||
    s.toLowerCase() === "internal" ||
    s.toLowerCase() === "in-house"
  );
}

function isExternalFleetOwnership(t: unknown): boolean {
  const s = String(t ?? "").trim();
  return s.toUpperCase() === "EXTERNAL" || s.toLowerCase() === "external";
}


export interface FleetDashboardStats {
  totalVehicles: number;
  inHouse: number;
  external: number;

  activeVehicles: number;
  activePercentage: number;

  underMaintenance: number;
  maintenanceVehicles: string[]; // array of vehicle identifiers (plate/model/etc.)

  avgUtilization: number;
  utilizationChange: number;
}
interface Metric {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
}
export default function FleetMain() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOwnership, setFilterOwnership] = useState("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // const [summary, setSummary] = useState<DashboardStats | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [fleets,setFleets] = useState<FleetVehicle[]>([])
  // const [searchText, setSearchText] = useState("");

  const [summary, setSummary] = useState<FleetDashboardStats | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  
console.log(setFilterOwnership,filterOwnership)
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedFleet, setSelectedFeet] = useState<FleetVehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteLaoding, setDeleteLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fleetTab =
    searchParams.get("tab") === "types" ? "types" : "vehicles";

  const navigate = useNavigate();

  const setFleetTab = (tab: "vehicles" | "types") => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "vehicles") {
          next.delete("tab");
        } else {
          next.set("tab", "types");
        }
        return next;
      },
      { replace: true },
    );
  };

  const featchFleet = async (page=1,limit=10) => {
    try {
      setLoading(true);

      // const staffs = await api.get<FleetListResponse>(`/fleet?`);
      const staffs = await api.get<FleetListResponse>(`/fleet?search=all:${searchTerm}&page=${page}&pageSize=${limit}&filter=${filterStatus=="all"?"":`status:${filterStatus}`}`);
console.log(staffs.data)
      setFleets(staffs.data.data);
      setPagination(staffs.data.pagination);
      // toast.success(staffs.data.message)
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);

      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full err
    }
  };

  useEffect(() => {
    featchFleet(currentPage,pageSize);
  }, [searchTerm,currentPage,pageSize,filterStatus]);

  const featchSummary = async () => {
    try {
      setLoadingSummary(true);

      const staffs = await api.get(
        "/report/dashboard/fleet-summary"
      );
      setSummary(staffs.data?.data);
      // toast.success(staffs.data.message);
      setLoadingSummary(false);
    } catch (error: unknown) {
      setLoadingSummary(false);

      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };
  useEffect(() => {
    featchSummary();
  }, []);
  useEffect(() => {
    if (summary) {
      setMetrics([
        {
          label: "Total Vehicles",
          value: `${summary.totalVehicles}`,
          sublabel: `${summary.inHouse} Internal, ${summary.external} External`,
          icon: <IoCarSport className="h-5 w-5" />,
          color: "blue",
        },
        {
          label: "Active Vehicles",
          value: `${summary.activeVehicles}`,
          sublabel: `${summary.activePercentage}% of fleet`,
          icon: <IoCheckmarkCircle className="h-5 w-5" />,
          color: "green",
        },
        {
          label: "Under Maintenance",
          value: `${summary.underMaintenance}`,
          sublabel:
            summary.maintenanceVehicles.length > 0
              ? summary.maintenanceVehicles.join(", ")
              : "No vehicles",
          icon: <IoConstruct className="h-5 w-5" />,
          color: "orange",
        },
        {
          label: "Avg Utilization",
          value: `${summary.avgUtilization}%`,
          sublabel: `${summary.utilizationChange > 0 ? "+" : ""}${
            summary.utilizationChange
          }% from last month`,
          icon: <IoSpeedometer className="h-5 w-5" />,
          color: "purple",
        },
      ]);
    }
  }, [summary]);
  
  // Filter vehicles
  // const filteredVehicles = vehicles.filter((vehicle) => {
  //   const matchesSearch =
  //     vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase());

  //   const matchesStatus =
  //     filterStatus === "all" || vehicle.status === filterStatus;
  //   const matchesOwnership =
  //     filterOwnership === "all" || vehicle.ownership === filterOwnership;

  //   return matchesSearch && matchesStatus && matchesOwnership;
  // });

  // Sort vehicles
  // const sortedVehicles = [...filteredVehicles].sort((a, b) => {
  //   if (!sortColumn) return 0;

  //   const aValue = a[sortColumn as keyof typeof a];
  //   const bValue = b[sortColumn as keyof typeof b];

  //   if (!aValue || !bValue) return 0;
  //   if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
  //   if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
  //   return 0;
  // });

  

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Maintenance":
        return "bg-orange-100 text-orange-700";
      case "Inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // const getInsuranceColor = (insurance: string) => {
  //   switch (insurance) {
  //     case "Valid":
  //       return "bg-green-100 text-green-700";
  //     case "Expiring Soon":
  //       return "bg-yellow-100 text-yellow-700";
  //     case "Expired":
  //       return "bg-red-100 text-red-700";
  //     default:
  //       return "bg-gray-100 text-gray-700";
  //   }
  // };

  const handleDelete = async()=>{
    try {
      setDeleteLoading(true)
      const res = await api.delete('fleet/'+selectedFleet?.id)
      toast.success(res.data.message)
      featchFleet(currentPage,pageSize)
      setIsDialogOpen(false)
      setDeleteLoading(false)
  
    } catch (error:unknown) {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message||"Something went wrong!")
      setDeleteLoading(false);
    }
  };

    const handleExport = () => {
      exportToExcel("fleets", fleets, (fleet) => ({
        "Plate Number": fleet.plateNumber ?? "",
        Type: fleet.type ?? "",
        "Model": fleet?.model ?? "",
        "Driver":fleet?.driver?.user?.name ?? "",
        "Max Load":fleet.maxLoad,
        "Status": fleet?.status
    }));

    };

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main>
        <Card className="shadow-none border-none p-0">
          <CardContent className="px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Fleet Management
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Manage vehicles, drivers, and maintenance schedules
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                {fleetTab === "vehicles" && (
                <Button
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={handleExport}
                >
                  <IoDownload className="mr-2 h-4 w-4" />
                  Export
                </Button>
                )}
                <Button
                  onClick={() => navigate("/fleet/maintenance")}
                  className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white"
                >
                  <IoConstruct className="mr-2 h-4 w-4" />
                  Maintenance Logs
                </Button>
                <Button
                  variant="outline"
                  className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white hover:text-white"
                  onClick={() => navigate("/fleet/type/create?tab=types")}
                >
                  <IoAdd className="mr-2 h-4 w-4" />
                  Add vehicle type
                </Button>
                <Button
                  onClick={() => navigate("/fleet/create")}
                  className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white"
                >
                  <IoAdd className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                type="button"
                className={cn(
                  "pb-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                  fleetTab === "vehicles"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                )}
                onClick={() => setFleetTab("vehicles")}
              >
                Vehicles
              </button>
              <button
                type="button"
                className={cn(
                  "pb-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                  fleetTab === "types"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                )}
                onClick={() => setFleetTab("types")}
              >
                Vehicle types
              </button>
            </div>

            {fleetTab === "types" && <FleetTypesList />}

            {/* Metrics */}
            {fleetTab === "vehicles" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {loadingSummary
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="bg-white p-4">
                      <Skeleton
                        active
                        title={{ width: "60%" }}
                        paragraph={{ rows: 2, width: ["100%", "80%"] }}
                      />
                    </Card>
                  ))
                : metrics.map((metric, index) => (
                    <Card key={index} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">
                              {metric.label}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {metric.value}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {metric.sublabel}
                            </p>
                          </div>
                          <div
                            className={`p-3 rounded-lg bg-${metric.color}-100 text-${metric.color}-600`}
                          >
                            {metric.icon}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
            )}

            {/* Filters and Search */}
            {fleetTab === "vehicles" && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by plate, brand, model, or driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-7"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px] py-7">
                  <IoFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {/* <Select
                value={filterOwnership}
                onValueChange={setFilterOwnership}
              >
                <SelectTrigger className="w-full md:w-[200px] py-7">
                  <IoFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Ownership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ownership</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="EXTERNAL">External</SelectItem>
                </SelectContent>
              </Select> */}
            </div>
            )}

            {/* Table */}
            {fleetTab === "vehicles" && (
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[50px]">
                      <Checkbox />
                    </TableHead>
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("plateNumber")}
                    >
                      Plate Number
                    </TableHead>
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("type")}
                    >
                      Vehicle Type
                    </TableHead>
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("type")}
                    >
                      Type
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Vehicle
                    </TableHead>

                    <TableHead className="text-gray-600 font-medium">
                      Driver
                    </TableHead>
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("utilizationRate")}
                    >
                      Max Load
                    </TableHead>
                    {/* <TableHead className="text-gray-600 font-medium">
                      Mileage
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Insurance
                    </TableHead> */}
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("status")}
                    >
                      Status
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    {loading && (
                      <TableCell colSpan={11}>
                        <div className="flex justify-center items-center py-8">
                          <Spinner className="h-6 w-6 text-blue-600 mr-2" />
                          <span className="text-gray-600 font-medium">
                            Loading fleet data...
                          </span>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  {fleets.map((vehicle) => (
                    <TableRow
                      key={vehicle.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/fleet/${vehicle.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {vehicle.plateNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100">
                          {vehicle?.vehicleType?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isInternalFleetOwnership(vehicle?.type)
                              ? "bg-green-100 text-green-700"
                              : isExternalFleetOwnership(vehicle?.type)
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-500"
                          }
                        >
                          {isInternalFleetOwnership(vehicle?.type)
                            ? "Internal"
                            : isExternalFleetOwnership(vehicle?.type)
                              ? "External"
                              : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{vehicle.model}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          {vehicle.driverId ? (
                            <span className="text-sm text-gray-500">
                              {vehicle?.driver?.user?.name}
                            </span>
                          ) : (
                            <span className="font-medium">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{vehicle.maxLoad}</span>

                        {/* <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
                            <div
                              className={`h-2 rounded-full ${
                                vehicle.utilizationRate >= 80
                                  ? "bg-green-500"
                                  : vehicle.utilizationRate >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${vehicle.utilizationRate}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {vehicle.utilizationRate}%
                          </span>
                        </div> */}
                      </TableCell>
                      {/* <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {vehicle.currentMileage.toLocaleString()} km
                          </span>
                          <span className="text-sm text-gray-500">
                            {vehicle.totalTrips} trips
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="secondary"
                            className={getInsuranceColor(vehicle.insurance)}
                          >
                            {vehicle.insurance}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {vehicle.insuranceExpiry}
                          </span>
                        </div>
                      </TableCell> */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(vehicle.status)}
                        >
                          {vehicle.status === "Active" && (
                            <IoCheckmarkCircle className="mr-1" />
                          )}
                          {vehicle.status === "Maintenance" && (
                            <IoWarning className="mr-1" />
                          )}
                          {vehicle.status === "Inactive" && (
                            <IoBan className="mr-1" />
                          )}
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/fleet/edit/${vehicle.id}?fleet=${encodeURIComponent(
                                  JSON.stringify(vehicle),
                                )}`,
                              );
                            }}
                          >
                            <MdEdit className="h-4 w-4" />
                          </Button>
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                          >
                            <IoLockOpen className="h-6 w-6 font-bold" />
                          </Button> */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // navigate(`/staff/edit/${member.id}`);
                              setIsDialogOpen(true); //

                              setSelectedFeet(vehicle);
                            }}
                            className="p-2 text-red-400 bg-red-50 cursor-pointer opacity-60 hover:bg-red-100 hover:text-red-700"
                          >
                            <MdDelete className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}

            {/* Pagination */}
            {fleetTab === "vehicles" && (
            <TablePagination
              currentPage={currentPage}
              totalPages={pagination?.totalPages || 1}
              pageSize={pagination?.pageSize || 10}
              totalItems={pagination?.total || 0}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
            )}
          </CardContent>
        </Card>
      </main>
      <ConfirmDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        title="Delete Staff Member"
        description="Are you sure you want to delete this fllet? This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleteLaoding}
      />
    </div>
  );
}
