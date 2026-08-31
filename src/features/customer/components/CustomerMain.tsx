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
  Star,
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
  IoPerson,
  IoBusiness,
  IoStar,
  IoWarning,
  IoLockOpen,
  IoFilter,
} from "react-icons/io5";
import {  MdDelete } from "react-icons/md";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type { Customer, CustomerListResponse, Pagination } from "@/types/types";
import ConfirmDialog from "@/components/common/DeleteModal";
import { Skeleton } from "antd";
import { Spinner } from "@/utils/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToExcel } from "@/utils/exportToExcel";


interface DashboardStats {
  totalCustomers: {
    value: number;
    newThisMonth: number;
    change: number;
  };
  activeCustomers: {
    value: number;
    rate: number;
  };
  corporateClients: {
    value: number;
    newThisMonth: number;
  };
  loyaltyMembers: {
    value: number;
    note: string;
  };
}

interface Metric {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  color: string;
}
export default function CustomerMain() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metric[]>([]);

  // Calculate pagination
  const [summary, setSummary] = useState<DashboardStats | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [customers,setCustomers] = useState<any[]>([])
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteLaoding, setDeleteLoading] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const featchCustomers = async (page=1,limit=10) => {
    try {
      setLoading(true);

      const staffs = await api.get<CustomerListResponse>(`/users/customers?search=all:${searchText}&page=${page}&pageSize=${limit}&filter=${filterStatus=="all"?"":`customerType:${filterStatus}`}`);
      setCustomers(staffs.data.data);
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
    featchCustomers(currentPage,pageSize);
  }, [searchText,currentPage,pageSize,filterStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const featchSummary = async () => {
    try {
      setLoadingSummary(true);

      const staffs = await api.get<any>(
        "/report/dashboard/customer-summary"
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
  useEffect(() => {
    featchSummary();
  }, []);
  useEffect(() => {
    if (summary) {
      setMetrics([
        {
          title: "Total Customers",
          value: summary.totalCustomers.value,
          change: `${summary.totalCustomers.newThisMonth} new this month`,
          trend: summary.totalCustomers.change >= 0 ? "up" : "down",
          color: "blue",
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: "Active Customers",
          value: summary.activeCustomers.value,
          change: `${summary.activeCustomers.rate}% active rate`,
          trend: summary.activeCustomers.rate >= 0 ? "up" : "down",
          color: "green",
          icon: <UserCheck className="h-5 w-5" />,
        },
        {
          title: "Corporate Clients",
          value: summary.corporateClients.value,
          change: `${summary.corporateClients.newThisMonth} new contracts`,
          trend: summary.corporateClients.newThisMonth >= 0 ? "up" : "down",
          color: "purple",
          icon: <Building2 className="h-5 w-5" />,
        },
        {
          title: "Credit Members",
          value: summary.loyaltyMembers.value,
          change: summary.loyaltyMembers.note || "",
          trend: "up", // always "up" for note
          color: "orange",
          icon: <Star className="h-5 w-5" />,
        },
      ]);
    }
  }, [summary]);

  const handleDelete = async()=>{
    try {
      setDeleteLoading(true)
      const res = await api.delete('users/'+selectedCustomer?.id)
      toast.success(res.data.message)
      featchCustomers(currentPage,pageSize)
      setIsDialogOpen(false)
      setDeleteLoading(false)
  
    } catch (error:any) {
      toast.error(error?.response.data.message||"Something went wrong!")
      setDeleteLoading(false)
    }finally{
      setDeleteLoading(false)
    }
  
    }


    const handleExport = () => {
      exportToExcel("customers", customers, (customer) => ({
        "Name":( customer.name || customer?.companyName) ?? "",
        Email: customer.email ?? "",
        Phone: customer.phone ?? "",
        "Customer Type": customer.customerType ?? "",
        "Total Orders": customer?.ordersCount ?? "",
        "Total Spent": customer?.ordersTotalPrice ?? "",
        "Status":customer?.isActive?"Active":"InActive"
    }));

    };

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Customer Management
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleExport}
            
            variant="outline" className="text-gray-600 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] cursor-pointer"
              onClick={() => navigate("/customer/create")}
            >
              <IoAdd className="h-4 w-4 mr-2" />
              Add New Customer
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3 mb-6">
          <Button
            variant="outline"
            className="text-gray-600 bg-white cursor-pointer"
            onClick={() => navigate("/customer/corporate")}
          >
            <IoBusiness className="h-4 w-4 mr-2" />
            Corporate Clients
          </Button>
          <Button
            variant="outline"
            className="text-gray-600 bg-white cursor-pointer"
            onClick={() => navigate("/customer/loyalty")}
          >
            <IoStar className="h-4 w-4 mr-2" />
            Credit Program
          </Button>
          <Button
            variant="outline"
            className="text-gray-600 bg-white cursor-pointer"
            onClick={() => navigate("/customer/complaints")}
          >
            <IoWarning className="h-4 w-4 mr-2" />
            Complaints
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {
          loadingSummary?   Array.from({ length: 4 }).map((_, i) => (
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
                        ? "bg-blue-100 text-[#EE1E21]"
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
        <div className="flex flex-col md:flex-row gap-4 mb-6">
       
        <div className="relative w-80 mb-6">
          <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
          <Input
          value={searchText}
          onChange={(e)=>setSearchText(e.target.value)}
            placeholder="Search branches..."
            className="pl-10 pr-3 w-full py-6"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px] py-6">
                  <IoFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="CORPORATE">Corporate</SelectItem>
                </SelectContent>
              </Select>
</div>
        {/* Customers Table */}
        <Card className="bg-white">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Customer ID
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Contact
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Type
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Total Orders
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Total Spent
                </TableHead>
                {/* <TableHead className="text-gray-600 font-medium">
                  Loyalty Points
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Last Order
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
                        Loading customer data...
                      </span>
                    </div>
                  </TableCell>
                )}
              </TableRow>
              {customers.map((customer, index) => (
                <TableRow
                  key={index}
                  className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/customer/details/${customer.id}`)}
                >
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    <Button
                      variant="ghost"
                      className="p-0 text-[#EE1E21] hover:text-[#cc1a1c] cursor-pointer"
                    >
                      {customer.customId}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#EE1E21]/10 rounded-full flex items-center justify-center">
                        {customer.type === "Corporate" ? (
                          <IoBusiness className="h-4 w-4 text-[#EE1E21]" />
                        ) : (
                          <IoPerson className="h-4 w-4 text-[#EE1E21]" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {decodeURIComponent(customer.name)}
                        </span>
                        {customer?.companyName && (
                          <div className="text-sm text-gray-500">
                            {(customer?.companyName)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900">
                        {customer.email}
                      </span>
                      <span className="text-sm text-gray-500">
                        {customer.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        customer.customerType === "Corporate"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {customer.customerType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {customer?.ordersCount}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {/* {customer?.totalSpent.toLocaleString()} ETB */}
                    {Number(customer?.ordersTotalPrice).toFixed(2)}
                  </TableCell>
                  {/* <TableCell>
                    <div className="flex items-center gap-1">
                      <IoStar className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-gray-900">
                        {customer?.loyaltyPoints}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(customer?.lastOrderDate).toLocaleDateString(
                      "en-GB"
                    )}
                  </TableCell> */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        customer?.isActive 
                          ? "bg-green-100 text-green-700"
                       
                          : "bg-red-100 text-red-700"
                      }
                    >
                      ● {customer?.isActive?"Active":"InActive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customer/edit/${customer.id}`);
                        }}
                      >
                        <MdEdit className="h-4 w-4" />
                      </Button> */}
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
                          setIsDialogOpen(true); //
                     
                          setSelectedCustomer(customer)
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
  description="Are you sure you want to delete this customer? This action cannot be undone."
  onConfirm={handleDelete}
  loading={deleteLaoding}
/>
    </div>
  );
}
