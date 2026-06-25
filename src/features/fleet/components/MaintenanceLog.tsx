import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import {
  IoAdd,
  IoConstruct,
  IoSearch,
  IoArrowBack,

} from "react-icons/io5";

import api from "@/lib/api/api";
import type { Pagination } from "@/types/types";
import toast from "react-hot-toast";
import { Spinner } from "@/utils/spinner";

const maintenanceLogs = [
  {
    id: "MNT-001",
    vehicleId: "VH-001",
    plateNumber: "AA-12345",
    type: "Scheduled",
    service: "Oil Change & Filter Replacement",
    date: "2025-09-15",
    cost: 3500,
    mileage: 45000,
    provider: "Auto Care Center",
    status: "Completed",
    technician: "Alemayehu Tesfaye",
    nextService: "2025-10-15",
    notes: "Changed engine oil (5W-30) and oil filter. All systems normal.",
  },
  {
    id: "MNT-002",
    vehicleId: "VH-002",
    plateNumber: "AA-67890",
    type: "Scheduled",
    service: "Tire Rotation & Brake Inspection",
    date: "2025-09-20",
    cost: 2800,
    mileage: 78000,
    provider: "Truck Service Station",
    status: "Completed",
    technician: "Biruk Mekonnen",
    nextService: "2025-10-20",
    notes: "Rotated all tires. Brake pads at 60%. No issues found.",
  },
  {
    id: "MNT-003",
    vehicleId: "VH-003",
    plateNumber: "AA-24680",
    type: "Repair",
    service: "Transmission Repair",
    date: "2025-09-28",
    cost: 15000,
    mileage: 15000,
    provider: "Premium Auto Repair",
    status: "In Progress",
    technician: "Getachew Solomon",
    nextService: "2025-10-28",
    notes: "Transmission showing signs of slipping. Undergoing major repair.",
  },
  {
    id: "MNT-004",
    vehicleId: "VH-005",
    plateNumber: "AA-11223",
    type: "Scheduled",
    service: "Annual Inspection",
    date: "2025-09-05",
    cost: 5000,
    mileage: 120000,
    provider: "Certified Inspection Center",
    status: "Completed",
    technician: "Henok Tadesse",
    nextService: "2026-09-05",
    notes: "Passed annual inspection. All documentation updated.",
  },
  {
    id: "MNT-005",
    vehicleId: "VH-006",
    plateNumber: "AA-99887",
    type: "Scheduled",
    service: "Engine Tune-up",
    date: "2025-09-25",
    cost: 1200,
    mileage: 8000,
    provider: "Motorcycle Service Hub",
    status: "Completed",
    technician: "Yohannes Bekele",
    nextService: "2025-10-25",
    notes: "Cleaned spark plug, adjusted carburetor. Running smoothly.",
  },
  {
    id: "MNT-006",
    vehicleId: "VH-001",
    plateNumber: "AA-12345",
    type: "Repair",
    service: "Air Conditioning Repair",
    date: "2025-08-10",
    cost: 4500,
    mileage: 43000,
    provider: "Auto Care Center",
    status: "Completed",
    technician: "Alemayehu Tesfaye",
    nextService: null,
    notes: "Replaced AC compressor and recharged refrigerant.",
  },
  {
    id: "MNT-007",
    vehicleId: "VH-008",
    plateNumber: "AA-77665",
    type: "Scheduled",
    service: "Battery Replacement",
    date: "2025-09-18",
    cost: 6500,
    mileage: 34000,
    provider: "Battery World",
    status: "Completed",
    technician: "Tesfaye Abera",
    nextService: "2027-09-18",
    notes: "Replaced old battery with new 12V 70Ah battery. Warranty: 2 years.",
  },
  {
    id: "MNT-008",
    vehicleId: "VH-002",
    plateNumber: "AA-67890",
    type: "Emergency",
    service: "Flat Tire Repair",
    date: "2025-09-12",
    cost: 800,
    mileage: 77500,
    provider: "Roadside Assistance",
    status: "Completed",
    technician: "Dawit Girma",
    nextService: null,
    notes: "Fixed flat tire on road. Puncture from nail.",
  },
];



export default function MaintenanceLog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState<boolean>(true);
  // const [searchText, setSearchText] = useState("");
  const [fleetLogs,setFleetLogs] =useState<any>([])
  const navigate = useNavigate();


  const [pagination, setPagination] = useState<Pagination | null>(null);
console.log(pagination,setFilterStatus,setFilterType)
  const featchFleetLogs = async (page=1,limit=10) => {
    try {
      setLoading(true);

      const staffs = await api.get<any>(`/fleet/maintenance?search=all:${searchTerm}&page=${page}&pageSize=${limit}`);
      setFleetLogs(staffs.data.data);
      setPagination(staffs.data.pagination);
      // toast.success(staffs.data.message)
      setLoading(false);
    } catch (error: any) {
      setLoading(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };

  useEffect(() => {
    featchFleetLogs(currentPage,pageSize);
  }, [searchTerm,currentPage,pageSize]);


  // Filter logs
  const filteredLogs = maintenanceLogs.filter((log) => {
    const matchesSearch =
      log.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || log.type === filterType;
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortColumn) {
      // Default sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }

    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];

    // Handle possible null or undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === "asc" ? 1 : -1;
    if (bValue == null) return sortDirection === "asc" ? -1 : 1;

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate pagination
  const totalItems = sortedLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  // const startIndex = (currentPage - 1) * pageSize;
  // const endIndex = startIndex + pageSize;
  // const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

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

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "Completed":
  //       return "bg-green-100 text-green-700";
  //     case "In Progress":
  //       return "bg-orange-100 text-orange-700";
  //     case "Scheduled":
  //       return "bg-blue-100 text-blue-700";
  //     default:
  //       return "bg-gray-100 text-gray-700";
  //   }
  // };

  // const getTypeColor = (type: string) => {
  //   switch (type) {
  //     case "Scheduled":
  //       return "bg-blue-100 text-blue-700";
  //     case "Repair":
  //       return "bg-orange-100 text-orange-700";
  //     case "Emergency":
  //       return "bg-red-100 text-red-700";
  //     default:
  //       return "bg-gray-100 text-gray-700";
  //   }
  // };

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main>
        <Card className="shadow-none border-none">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/fleet")}
                    className="cursor-pointer bg-[#EE1E21] text-[#FADF4B] hover:bg-[#cc1a1c] hover:text-[#FADF4B] p-2"
                  >
                    <IoArrowBack className="h-5 w-5" />
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <IoConstruct className="text-[#EE1E21]" />
                    Maintenance Logs
                  </h1>
                </div>
                <p className="text-gray-500 text-sm ml-11">
                  Track vehicle maintenance, repairs, and service history
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Button
                  onClick={() => navigate("/fleet/maintenance/create")}
                  className="bg-[#EE1E21] hover:bg-[#cc1a1c] cursor-pointer text-[#FADF4B]"
                >
                  <IoAdd className="mr-2 h-4 w-4" />
                  Add Maintenance Record
                </Button>
              </div>
            </div>

            {/* Metrics */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {metrics.map((metric, index) => (
                <Card key={index} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{metric.label}</p>
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
            </div> */}

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative max-w-[550px]">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by plate number, service, or provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-7"
                />
              </div>
              {/* <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[200px] py-7">
                  <IoFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px] py-7">
                  <IoFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select> */}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("date")}
                    >
                      Date
                    </TableHead>
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("plateNumber")}
                    >
                      Vehicle
                    </TableHead>
                    {/* <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("type")}
                    >
                      Type
                    </TableHead> */}
                    <TableHead className="text-gray-600 font-medium">
                      Service Description
                    </TableHead>
                    {/* <TableHead className="text-gray-600 font-medium">
                      Provider
                    </TableHead> */}
                    {/* <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("mileage")}
                    >
                      Mileage
                    // </TableHead> */}
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("cost")}
                    >
                      Cost
                    </TableHead>
                    {/* <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("status")}
                    >
                      Status
                    </TableHead> */}
                    {/* <TableHead className="text-gray-600 font-medium">
                      Next Service
                    </TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                <TableRow>
                {loading && (
                  <TableCell colSpan={11}>
                    <div className="flex justify-center items-center py-8">
                      <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                      <span className="text-gray-600 font-medium">
                        Loading Maintenance logs data...
                      </span>
                    </div>
                  </TableCell>
                )}
              </TableRow>
                  {fleetLogs.map((log:any) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        navigate(`/fleet/maintenance/details/${log.id}`)
                      }
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(log.date).toLocaleDateString("en-GB")}
                          </span>
                          <span className="text-sm text-gray-500">
                            {log.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-[#EE1E21]">
                            {log?.vehicle?.plateNumber}
                          </span>
                          <span className="text-sm text-gray-500">
                            {log?.vehicle?.model}
                          </span>
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        <Badge
                          variant="secondary"
                          className={getTypeColor(log.type)}
                        >
                          {log.type}
                        </Badge>
                      </TableCell> */}
                      <TableCell>
                        <div className="flex flex-col max-w-[250px]">
                          <span className="font-medium truncate">
                            {log.service}
                          </span>
                          <span className="text-sm text-gray-500">
                            {log.maintenance}
                          </span>
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        <span className="text-sm">{log.createdBy}</span>
                      </TableCell> */}
                      {/* <TableCell>
                        <span className="font-medium">
                          {log.mileage.toLocaleString()} km
                        </span>
                      </TableCell> */}
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {log.cost.toLocaleString()} ETB
                        </span>
                      </TableCell>
                      {/* <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(log.status)}
                        >
                          {log.status === "Completed" && (
                            <IoCheckmarkCircle className="mr-1" />
                          )}
                          {log.status === "In Progress" && (
                            <IoWarning className="mr-1" />
                          )}
                          {log.status}
                        </Badge>
                      </TableCell> */}
                      {/* <TableCell>
                        {log.nextService ? (
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {new Date(log.nextService).toLocaleDateString(
                                "en-GB"
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.ceil(
                                (new Date(log.nextService).getTime() -
                                  new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              days
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
