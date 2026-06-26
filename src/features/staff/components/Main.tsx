"use client";

import { useState } from "react";
import {
  Search,
  Download,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  UserX,
  Building2,
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
import { IoAdd, IoPerson, IoLockOpen } from "react-icons/io5";
import { MdEdit, MdDelete } from "react-icons/md";

const staff = [
  {
    id: "STF-001",
    name: "Abebe Kebede",
    email: "abebe.k@company.com",
    phone: "+251 911 234 567",
    role: "Driver",
    branch: "Addis Ababa Central",
    branchId: "1",
    status: "Active",
    assignedOrders: 12,
    completedOrders: 145,
    rating: 4.8,
  },
  {
    id: "STF-002",
    name: "Tigist Hailu",
    email: "tigist.h@company.com",
    phone: "+251 911 345 678",
    role: "Manager",
    branch: "Dire Dawa Branch",
    branchId: "2",
    status: "Active",
    assignedOrders: 0,
    completedOrders: 0,
    rating: 4.9,
  },
  {
    id: "STF-003",
    name: "Dawit Alemu",
    email: "dawit.a@company.com",
    phone: "+251 911 456 789",
    role: "Driver",
    branch: "Mekelle Branch",
    branchId: "3",
    status: "Active",
    assignedOrders: 8,
    completedOrders: 98,
    rating: 4.7,
  },
  {
    id: "STF-004",
    name: "Marta Tadesse",
    email: "marta.t@company.com",
    phone: "+251 911 567 890",
    role: "Dispatcher",
    branch: "Addis Ababa Central",
    branchId: "1",
    status: "Active",
    assignedOrders: 0,
    completedOrders: 0,
    rating: 4.6,
  },
  {
    id: "STF-005",
    name: "Yohannes Desta",
    email: "yohannes.d@company.com",
    phone: "+251 911 678 901",
    role: "Driver",
    branch: "Hawassa Branch",
    branchId: "5",
    status: "On Leave",
    assignedOrders: 5,
    completedOrders: 67,
    rating: 4.5,
  },
];

const metrics = [
  {
    title: "Total Staff",
    value: "86",
    change: "8 new this month",
    trend: "up",
    icon: <Users className="h-5 w-5" />,
    color: "blue",
  },
  {
    title: "Active Staff",
    value: "82",
    change: "95% active rate",
    trend: "up",
    icon: <UserCheck className="h-5 w-5" />,
    color: "green",
  },
  {
    title: "On Leave",
    value: "4",
    change: "2 less than last week",
    trend: "down",
    icon: <UserX className="h-5 w-5" />,
    color: "orange",
  },
  {
    title: "Branches Covered",
    value: "5",
    change: "All branches staffed",
    trend: "up",
    icon: <Building2 className="h-5 w-5" />,
    color: "purple",
  },
];

export default function StaffMain() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  // Calculate pagination
  const totalItems = staff.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStaff = staff.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Staff Management
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="text-gray-600 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] cursor-pointer"
              onClick={() => navigate("/staff/create")}
            >
              <IoAdd className="h-4 w-4 mr-2" />
              Add New Staff
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <div
                    className={`p-3 rounded-full ${
                      metric.color === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : metric.color === "green"
                        ? "bg-green-100 text-green-600"
                        : metric.color === "purple"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {metric.icon}
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
            placeholder="Search staff..."
            className="pl-10 pr-3 w-full py-6"
          />
        </div>

        {/* Staff Table */}
        <Card className="bg-white">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Staff ID
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Email
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Phone
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Role
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Branch
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Assigned Orders
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Completed
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
              {paginatedStaff.map((member, index) => (
                <TableRow
                  key={index}
                  className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/staff/${member.id}`)}
                >
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    <Button
                      variant="ghost"
                      className="p-0 text-[#EE1E21] hover:text-[#cc1a1c] cursor-pointer"
                    >
                      {member.id}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#EE1E21]/10 rounded-full flex items-center justify-center">
                        <IoPerson className="h-4 w-4 text-[#EE1E21]" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {member.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {member.email}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {member.phone}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        member.role === "Manager"
                          ? "bg-purple-100 text-purple-700"
                          : member.role === "Driver"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {member.branch}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700"
                    >
                      {member.assignedOrders}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {member.completedOrders}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        member.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      ● {member.status}
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
                          navigate(`/staff/edit/${member.id}`);
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
                        disabled
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
