"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Download,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/utils/spinner";

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
import api from "@/lib/api/api";
import type {
  Pagination,
  Staff,
  StaffListResponse,
} from "@/types/types";
import toast from "react-hot-toast";
import { exportToExcel } from "@/utils/exportToExcel";
import ConfirmDialog from "@/components/common/DeleteModal";
import { Skeleton } from "antd";



export interface StaffStats {
  totalStaff: {
    value: number;
    newThisMonth: number;
  };
  activeStaff: {
    value: number;
    activeRate: number;
  };
  onLeave: {
    value: number;
    changeFromLastWeek: number;
  };
  branchesCovered: {
    value: number;
    note: string;
  };
}

interface Metric {
  title: string;
  value: number | string;
  change?: string;
  trend?: "up" | "down";
  color: "blue" | "green" | "purple" | "orange";
  icon: React.ReactNode;
}

function StaffPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  const [staffs, setStaffs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<StaffStats | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [searchText, setSearchText] = useState("");

  // const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [deleteLaoding, setDeleteLoading] = useState<boolean>(false);


  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const featchStaffs = async (page=1,limit=10) => {
    try {
      setLoading(true);

      const staffs = await api.get<StaffListResponse>(`/staff?search=all:${searchText}&page=${page}&pageSize=${limit}`);
      setStaffs(staffs.data.data);
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
    featchStaffs(currentPage,pageSize);
  }, [searchText,currentPage,pageSize]);

  const featchSummary = async () => {
    try {
      setLoadingSummary(true);

      const staffs = await api.get<any>(
        "/report/dashboard/staff-summary"
      );
      setSummary(staffs.data?.data);
      // toast.success(staffs.data.message);
      setLoadingSummary(false);
    } catch (error: any) {
      setLoadingSummary(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };

  // When summary changes, build metrics array
  useEffect(() => {
    if (summary) {
      setMetrics([
        {
          title: "Total Staff",
          value: summary.totalStaff.value,
          change: `+${summary.totalStaff.newThisMonth} new this month`,
          trend: "up",
          color: "blue",
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: "Active Staff",
          value: summary.activeStaff.value,
          change: `${summary.activeStaff.activeRate}% active rate`,
          trend: summary.activeStaff.activeRate > 0 ? "up" : "down",
          color: "green",
          icon: <UserCheck className="h-5 w-5" />,
        },
        // {
        //   title: "On Leave",
        //   value: summary.onLeave.value,
        //   change: `${summary.onLeave.changeFromLastWeek} from last week`,
        //   trend: summary.onLeave.changeFromLastWeek > 0 ? "up" : "down",
        //   color: "orange",
        //   icon: <UserX className="h-5 w-5" />,
        // },
        {
          title: "Branches Covered",
          value: summary.branchesCovered.value,
          change: "All branches staffed" ,
          trend: "up",
          color: "purple",
          icon: <Building2 className="h-5 w-5" />,
        },
      ]);
    }
  }, [summary]);

  useEffect(() => {
    featchSummary();
  }, []);
  const handleExport = () => {
    exportToExcel("staffs", staffs, (s) => ({
      Name: s.name ?? "",
      Email: s.email ?? "",
      Phone: s.phone ?? "",
      Role: s.role?.name ?? "N/A",
      Branch: s.branch?.name ?? "N/A",
      "Email Verified": s.emailVerified ? "Yes" : "No",
      "Created At": s.createdAt ? new Date(s.createdAt).toLocaleString() : "",
      "Updated At": s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "",
    }));
  };


  const handleDelete = async()=>{
  try {
    setDeleteLoading(true)
    const res = await api.delete('staff/'+selectedStaff?.id)
    toast.success(res.data.message)
    featchStaffs(currentPage,pageSize)
    setIsDialogOpen(false)
    setDeleteLoading(false)

  } catch (error:any) {
    toast.error(error?.response.data.message||"Something went wrong!")
    setDeleteLoading(false)
    
  }

  }
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
            <Button
              onClick={handleExport}
              variant="outline"
              className="text-gray-600 bg-transparent"
            >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loadingSummary?   Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="bg-white p-4">
          <Skeleton
            active
            title={{ width: "60%" }}
            paragraph={{ rows: 2, width: ["100%", "80%"] }}
          />
        </Card>
      )):metrics.map((metric, index) => (
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
            onChange={(val) => setSearchText(val.target.value)}
            value={searchText}
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
                {/* <TableHead className="text-gray-600 font-medium">
                  Assigned Orders
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Completed
                </TableHead> */}
                <TableHead className="text-gray-600 font-medium">
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
                      <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                      <span className="text-gray-600 font-medium">
                        Loading staff data...
                      </span>
                    </div>
                  </TableCell>
                )}
              </TableRow>
              {staffs.map((member, index) => (
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
                      {member?.customId}
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
                        member.role?.name === "Manager"
                          ? "bg-purple-100 text-purple-700"
                          : member.role?.name === "Driver"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }
                    >
                      {member.role?.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {member.branch?.name}
                  </TableCell>
                  {/* <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700"
                    >
                      {member.assignedOrders}
                      12
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {member.completedOrders}
                    145
                  </TableCell> */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        member?.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      ● {member?.isActive?"Active":"InActive"}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          // navigate(`/staff/edit/${member.id}`);
                          // setDeleteId(member.id); // set which staff to delete
                          setIsDialogOpen(true); //
                          setSelectedStaff(member)
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
            <TableBody></TableBody>
          </Table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages||1}
            pageSize={pagination?.pageSize||10}
            totalItems={pagination?.total||0}
            onPageChange={handlePageChange}
            
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      </main>

      <ConfirmDialog
  isOpen={isDialogOpen}
  setIsOpen={setIsDialogOpen}
  title="Delete Staff Member"
  description="Are you sure you want to delete this staff member? This action cannot be undone."
  onConfirm={handleDelete}
  loading={deleteLaoding}
/>
    </div>
  );
}

export default StaffPage;
