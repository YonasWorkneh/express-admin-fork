"use client";

import { useEffect, useState } from "react";
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
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type { Branch, BranchListResponse, Pagination } from "@/types/types";
import { Spinner } from "@/utils/spinner";
import ConfirmDialog from "@/components/common/DeleteModal";
import { Skeleton } from "antd";
import { exportToExcel } from "@/utils/exportToExcel";


interface Metric {
  title: string;
  value: number | string;
  change?: string;
  trend?: "up" | "down";
  color: "blue" | "green" | "purple" | "orange";
  icon: React.ReactNode;
}

interface BranchDashboardStats {
  totalBranches: { value: number; newThisMonth: number };
  activeOrders: { value: number; percentChange: number };
  totalStaff: { value: number; newThisMonth: number };
  managerVacancies: { value: number; note: string };
}

  function BranchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  // Calculate pagination
  // const totalItems = branches.length;
  // const totalPages = Math.ceil(totalItems / pageSize);

  // const paginatedBranches = branches.slice(startIndex, endIndex);
  const [stats, setStats] = useState<BranchDashboardStats | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [loadingBrand, setLoadingBrand] = useState(false);
  const [ branches,setBranches] = useState<Branch[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deleteLaoding, setDeleteLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const featchBranch = async () => {
    try {
      setLoadingBrand(true);

      const branch = await api.get<BranchListResponse>(
        `/branch?${searchText&&'search=all:'+searchText+'&'}page=${currentPage}&pageSize=${pageSize}`
      );
      setBranches(branch.data.data);
      setPagination(branch.data?.pagination)
      // toast.success(staffs.data.message);
      setLoadingBrand(false);
    } catch (error: any) {
      setLoadingBrand(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };

  useEffect(() => {
    featchBranch();
  }, [searchText,currentPage,pageSize]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/report/dashboard/branch-summary");
      setStats(res.data?.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

   useEffect(() => {
    if (stats) {
      setMetrics([
        {
          title: "Total Branches",
          value: stats.totalBranches.value,
          change: `${stats.totalBranches.newThisMonth} new this month`,
          trend: stats.totalBranches.newThisMonth > 0 ? "up" : "down",
          color: "blue",
          icon: <MapPin className="h-5 w-5" />,
        },
        {
          title: "Active Orders",
          value: stats.activeOrders.value,
          change: `${stats.activeOrders.percentChange}%`,
          trend: stats.activeOrders.percentChange >= 0 ? "up" : "down",
          color: "green",
          icon: <Package className="h-5 w-5" />,
        },
        {
          title: "Total Staff",
          value: stats.totalStaff.value,
          change: `${stats.totalStaff.newThisMonth} new hires`,
          trend: stats.totalStaff.newThisMonth > 0 ? "up" : "down",
          color: "purple",
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: "Manager Vacancies",
          value: stats.managerVacancies.value,
          change: stats.managerVacancies.note,
          trend: stats.managerVacancies.value > 0 ? "down" : "up",
          color: "orange",
          icon: <IoPerson className="h-5 w-5" />,
        },
      ]);
    }
  }, [stats]);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleDelete = async()=>{
    try {
      setDeleteLoading(true)
      const res = await api.delete('branch/'+selectedBranch?.id)
      toast.success(res.data.message)
      featchBranch()
      setIsDialogOpen(false)
      setDeleteLoading(false)
  
    } catch (error:any) {
      toast.error(error?.response.data.message||"Something went wrong!")
      setDeleteLoading(false)
      
    }
  
    }

    const handleExport = () => {
      exportToExcel("branches", branches, (branch) => ({
        "Branch Name": branch.name ?? "",
        Location: branch.location ?? "",
        "Manager": branch?.manager?.name ?? "N/A",
        "Total Orders":branch?.totalOrders,
        "Active Orders":Number(branch?.activeOrders).toFixed(),
        "Staff Count": Number(branch?.staffCount).toFixed(),
        "Revenue":Number(branch?.revenue).toFixed(2),
        "Efficiency":`${branch?.efficiency}%`
    }));

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
              onClick={handleExport}

              className="text-gray-600 bg-transparent text-xs sm:text-sm px-2 sm:px-4"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer text-xs sm:text-sm px-2 sm:px-4"
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
          {
          loading?   Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-white p-4">
          <Skeleton
            active
            title={{ width: "60%" }}
            paragraph={{ rows: 2, width: ["100%", "80%"] }}
          />
        </Card>
      )):
      metrics.map((metric, index) => (
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
          value={searchText}
          onChange={(e)=>setSearchText(e.target.value)}
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
                  <Checkbox className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white focus-visible:ring-blue-500/40" />
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
                {/* <TableHead className="text-gray-600 font-medium">
                  Status
                </TableHead> */}
                <TableHead className="text-gray-600 font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            <TableRow>
                {loadingBrand && (
                  <TableCell colSpan={11}>
                    <div className="flex justify-center items-center py-8">
                      <Spinner className="h-6 w-6 text-blue-600 mr-2" />
                      <span className="text-gray-600 font-medium">
                        Loading Beanch data...
                      </span>
                    </div>
                  </TableCell>
                )}
              </TableRow>
              {branches.map((branch, index) => (
                <TableRow
                  key={index}
                  className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/branch/${branch.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white focus-visible:ring-blue-500/40" />
                  </TableCell>
                  <TableCell className="font-medium text-blue-500">
                    {branch?.customId}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    <Button
                      variant="ghost"
                      className="p-0 text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      {branch.name}
                    </Button>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {branch.location}
                  </TableCell>
                  <TableCell>
                    {branch.manager  ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <IoPerson className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-900">
                          {branch?.manager?.name}
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
                    {/* Will Change */}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {/* {branch.totalOrders.toLocaleString()} */}
                   {Number(branch?.totalOrders).toFixed()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      {/* {branch.activeOrders} */}
                   {Number(branch?.activeOrders).toFixed()}
                      
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {/* {branch.staff} */}
                    {Number(branch?.staffCount).toFixed()}
                    </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {/* {branch.revenue} */}
                    {Number(branch?.revenue).toFixed(2)}

                    
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          // style={{ width: `${branch.efficiency}%` }}  Will Change
                             style={{width:`${branch?.efficiency}%`}} 
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {/* {branch.efficiency}% */}
                    {/* {branch?.analytics?.staffCount} */}
                        
                      </span>
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      ● {branch.status}
                    </Badge>
                  </TableCell> */}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
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
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                      >
                        <IoLockOpen className="h-6 w-6 font-bold" />
                      </Button>
                      <Button
                       onClick={(e) => {
                        e.stopPropagation();
                        // navigate(`/staff/edit/${member.id}`);
                        setIsDialogOpen(true); //
                        setSelectedBranch(branch)
                      }}
                        variant="ghost"
                        size="sm"
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
  title="Delete Branch"
  description="Are you sure you want to delete this branch? This action cannot be undone."
  onConfirm={handleDelete}
  loading={deleteLaoding}
/>
    </div>
  );
}



export default BranchPage;
