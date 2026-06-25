"use client";

import { useState } from "react";
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import {
  IoAdd,
  IoWarning,
  IoArrowBack,
  IoPerson,
  IoDocumentText,
} from "react-icons/io5";

const complaints = [
  {
    id: "COMP-001",
    customerId: "CUST-001",
    customerName: "Abebe Kebede",
    orderId: "ORD-2024-001",
    type: "Delivery",
    priority: "High",
    status: "Open",
    description: "Package delivered to wrong address",
    assignedTo: "Tigist Hailu",
    createdAt: "2024-12-10",
    updatedAt: "2024-12-10",
    resolution: null,
  },
  {
    id: "COMP-002",
    customerId: "CUST-003",
    customerName: "Marta Tadesse",
    orderId: "ORD-2024-002",
    type: "Service",
    priority: "Medium",
    status: "In Progress",
    description: "Poor customer service during pickup",
    assignedTo: "Dawit Alemu",
    createdAt: "2024-12-08",
    updatedAt: "2024-12-09",
    resolution: null,
  },
  {
    id: "COMP-003",
    customerId: "CUST-005",
    customerName: "Dawit Alemu",
    orderId: "ORD-2024-003",
    type: "Billing",
    priority: "Low",
    status: "Resolved",
    description: "Incorrect billing amount charged",
    assignedTo: "Henok Tadesse",
    createdAt: "2024-12-05",
    updatedAt: "2024-12-07",
    resolution: "Refund processed for overcharged amount",
  },
  {
    id: "COMP-004",
    customerId: "CUST-006",
    customerName: "Tigist Hailu",
    orderId: "ORD-2024-004",
    type: "Product",
    priority: "Critical",
    status: "Open",
    description: "Damaged goods received",
    assignedTo: "Yohannes Desta",
    createdAt: "2024-12-12",
    updatedAt: "2024-12-12",
    resolution: null,
  },
  {
    id: "COMP-005",
    customerId: "CUST-007",
    customerName: "Yohannes Desta",
    orderId: "ORD-2024-005",
    type: "Delivery",
    priority: "Medium",
    status: "Closed",
    description: "Late delivery without notification",
    assignedTo: "Marta Tadesse",
    createdAt: "2024-12-01",
    updatedAt: "2024-12-03",
    resolution: "Compensation provided and delivery process improved",
  },
];

const metrics = [
  {
    title: "Total Complaints",
    value: "127",
    change: "8 new this week",
    trend: "up",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "blue",
  },
  {
    title: "Open Complaints",
    value: "23",
    change: "18% of total",
    trend: "down",
    icon: <Clock className="h-5 w-5" />,
    color: "orange",
  },
  {
    title: "Resolved This Month",
    value: "89",
    change: "70% resolution rate",
    trend: "up",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "green",
  },
  {
    title: "Critical Issues",
    value: "5",
    change: "4% of total",
    trend: "down",
    icon: <XCircle className="h-5 w-5" />,
    color: "red",
  },
];

export default function Complaints() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const navigate = useNavigate();

  // Filter complaints
  const filteredComplaints = complaints.filter((complaint) => {
    const statusMatch =
      filterStatus === "all" || complaint.status === filterStatus;
    const priorityMatch =
      filterPriority === "all" || complaint.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  // Calculate pagination
  const totalItems = filteredComplaints.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-700";
      case "In Progress":
        return "bg-orange-100 text-orange-700";
      case "Resolved":
        return "bg-green-100 text-green-700";
      case "Closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700";
      case "High":
        return "bg-orange-100 text-orange-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Delivery":
        return <IoDocumentText className="h-4 w-4" />;
      case "Service":
        return <IoPerson className="h-4 w-4" />;
      case "Billing":
        return <IoDocumentText className="h-4 w-4" />;
      case "Product":
        return <IoWarning className="h-4 w-4" />;
      default:
        return <IoDocumentText className="h-4 w-4" />;
    }
  };

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
                    onClick={() => navigate("/customer")}
                    className="cursor-pointer bg-[#EE1E21] text-[#FADF4B] hover:bg-[#cc1a1c] hover:text-[#FADF4B] p-2"
                  >
                    <IoArrowBack className="h-5 w-5" />
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <IoWarning className="text-red-500" />
                    Customer Complaints
                  </h1>
                </div>
                <p className="text-gray-500 text-sm ml-11">
                  Track and manage customer complaints and issues
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Button
                  onClick={() => navigate("/customer/complaints/create")}
                  className="bg-red-500 hover:bg-red-600 cursor-pointer text-white"
                >
                  <IoAdd className="mr-2 h-4 w-4" />
                  New Complaint
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {metrics.map((metric, index) => (
                <Card key={index} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {metric.value}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {metric.change}
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

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative w-80">
                <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search complaints..."
                  className="pl-10 pr-3 w-full py-6"
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value)}
              >
                <SelectTrigger className="w-[180px] py-6">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterPriority}
                onValueChange={(value) => setFilterPriority(value)}
              >
                <SelectTrigger className="w-[180px] py-6">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Complaint ID
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Customer
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Type
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Priority
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Description
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Assigned To
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Status
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Created
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComplaints.map((complaint, index) => (
                    <TableRow
                      key={index}
                      className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/customer/complaints/details/${complaint.id}`)
                      }
                    >
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        <Button
                          variant="ghost"
                          className="p-0 text-[#EE1E21] hover:text-[#cc1a1c] cursor-pointer"
                        >
                          {complaint.id}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#EE1E21]/10 rounded-full flex items-center justify-center">
                            <IoPerson className="h-4 w-4 text-[#EE1E21]" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {complaint.customerName}
                            </span>
                            <div className="text-sm text-gray-500">
                              {complaint.orderId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(complaint.type)}
                          <span className="text-sm">{complaint.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getPriorityColor(complaint.priority)}
                        >
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <span className="text-sm text-gray-900 truncate block">
                            {complaint.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {complaint.assignedTo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(complaint.status)}
                        >
                          {complaint.status === "Open" && (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {complaint.status === "In Progress" && (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {complaint.status === "Resolved" && (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(complaint.createdAt).toLocaleDateString(
                          "en-GB"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 px-3 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/customer/complaints/edit/${complaint.id}`
                              );
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 px-3 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/customer/complaints/resolve/${complaint.id}`
                              );
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      </TableCell>
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
