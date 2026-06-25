"use client";

import { useState } from "react";
import {
  Search,
  Download,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  MapPin,
  Users,
  Package,
  LucideUserSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useNavigate } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import {
  IoAdd,
  IoLockOpen,
  IoPerson,
  IoPersonAdd,
  IoPersonRemove,
} from "react-icons/io5";
import { MdEdit, MdDelete } from "react-icons/md";

const branches = [
  {
    id: "B0001",
    name: "Addis Ababa Central",
    location: "Bole, Addis Ababa",
    manager: "John Doe",
    managerStatus: "Assigned",
    totalOrders: 1200,
    activeOrders: 85,
    staff: 25,
    revenue: "$85,000",
    efficiency: 96,
    status: "Active",
  },
  {
    id: "B0002",
    name: "Dire Dawa Branch",
    location: "City Center, Dire Dawa",
    manager: "Not Assigned",
    managerStatus: "Vacant",
    totalOrders: 950,
    activeOrders: 62,
    staff: 18,
    revenue: "$60,000",
    efficiency: 97,
    status: "Active",
  },
  {
    id: "B0003",
    name: "Mekelle Branch",
    location: "Downtown, Mekelle",
    manager: "Jane Smith",
    managerStatus: "Assigned",
    totalOrders: 780,
    activeOrders: 45,
    staff: 15,
    revenue: "$40,000",
    efficiency: 94,
    status: "Active",
  },
  {
    id: "B0004",
    name: "Bahir Dar Branch",
    location: "Lake Side, Bahir Dar",
    manager: "Not Assigned",
    managerStatus: "Vacant",
    totalOrders: 670,
    activeOrders: 38,
    staff: 12,
    revenue: "$38,000",
    efficiency: 96,
    status: "Active",
  },
  {
    id: "B0005",
    name: "Hawassa Branch",
    location: "Main Street, Hawassa",
    manager: "Mike Johnson",
    managerStatus: "Assigned",
    totalOrders: 800,
    activeOrders: 55,
    staff: 16,
    revenue: "$42,000",
    efficiency: 95,
    status: "Active",
  },
];

const metrics = [
  {
    title: "Total Branches",
    value: "5",
    change: "2 new this month",
    trend: "up",
    icon: <MapPin className="h-5 w-5" />,
    color: "blue",
  },
  {
    title: "Active Orders",
    value: "285",
    change: "15% increase",
    trend: "up",
    icon: <Package className="h-5 w-5" />,
    color: "green",
  },
  {
    title: "Total Staff",
    value: "86",
    change: "8 new hires",
    trend: "up",
    icon: <Users className="h-5 w-5" />,
    color: "purple",
  },
  {
    title: "Manager Vacancies",
    value: "2",
    change: "Need assignment",
    trend: "down",
    icon: <IoPerson className="h-5 w-5" />,
    color: "orange",
  },
];

export default function BranchMain() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  // Calculate pagination
  const totalItems = branches.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBranches = branches.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Main Content */}
      <main className="px-4 md:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Branch Management
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="outline"
              className="text-gray-600 bg-transparent text-xs sm:text-sm px-2 sm:px-4"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] cursor-pointer text-xs sm:text-sm px-2 sm:px-4"
              onClick={() => navigate("/branch/create")}
            >
              <IoAdd className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Create Branch</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-6">
          <Button
            variant="outline"
            className="text-gray-600 bg-white cursor-pointer text-xs sm:text-sm px-3 sm:px-4 w-full sm:w-auto"
            onClick={() => navigate("/branch/assign-manager")}
          >
            <IoPersonAdd className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Assign Manager</span>
            <span className="sm:hidden">Assign</span>
          </Button>
          <Button
            variant="outline"
            className="text-gray-600 bg-white cursor-pointer text-xs sm:text-sm px-3 sm:px-4 w-full sm:w-auto"
            onClick={() => navigate("/branch/revoke-manager")}
          >
            <IoPersonRemove className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Revoke Manager</span>
            <span className="sm:hidden">Revoke</span>
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {metric.value}
                      <span className="text-lg font-normal text-gray-400 ml-1">
                        -
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span
                        className={
                          metric.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-80 mb-6">
          <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search branches..."
            className="pl-10 pr-3 w-full py-6"
          />
        </div>

        {/* Branches Table */}
        <Card className="bg-white">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Branch ID
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Branch Name
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  <div className="flex items-center">
                    Location
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Manager
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Total Orders
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Active Orders
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Staff
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Revenue
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Efficiency
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Status
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBranches.map((branch, index) => (
                <TableRow
                  key={index}
                  className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/branch/${branch.id}`)}
                >
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium text-[#EE1E21]">
                    {branch.id}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    <Button
                      variant="ghost"
                      className="p-0 text-[#EE1E21] hover:text-[#cc1a1c] cursor-pointer"
                    >
                      {branch.name}
                    </Button>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {branch.location}
                  </TableCell>
                  <TableCell>
                    {branch.managerStatus === "Assigned" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <IoPerson className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-900">
                          {branch.manager}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <LucideUserSearch className="h-4 w-4 text-xl text-orange-700" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-700"
                        >
                          Vacant
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {branch.totalOrders.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-[#EE1E21]/10 text-[#EE1E21]"
                    >
                      {branch.activeOrders}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {branch.staff}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {branch.revenue}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#EE1E21]/10 rounded-full h-2">
                        <div
                          className="bg-[#EE1E21] h-2 rounded-full"
                          style={{ width: `${branch.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {branch.efficiency}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      ● {branch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/branch/edit/${branch.id}`);
                        }}
                      >
                        <MdEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c]"
                      >
                        <IoLockOpen className="h-6 w-6 font-bold" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-red-400 bg-red-50 cursor-not-allowed opacity-60 hover:bg-red-100 hover:text-red-700"
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
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      </main>
    </div>
  );
}
