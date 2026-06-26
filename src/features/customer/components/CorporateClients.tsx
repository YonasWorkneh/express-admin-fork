"use client";

import { useState } from "react";
import {
  Search,
  Building2,
  FileText,
  CreditCard,
  Calendar,
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
import { useNavigate } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import { IoAdd, IoBusiness, IoArrowBack } from "react-icons/io5";
import { MdBlock } from "react-icons/md";

const corporateClients = [
  {
    id: "CORP-001",
    companyName: "Ethiopian Airlines",
    contactPerson: "Tigist Hailu",
    email: "logistics@ethiopianairlines.com",
    phone: "+251 115 517 000",
    contractNumber: "EA-2024-001",
    creditLimit: 500000,
    paymentTerms: "Net 30",
    status: "Active",
    registrationDate: "2023-06-20",
    lastOrderDate: "2024-12-08",
    totalOrders: 156,
    totalSpent: 1250000,
    contractExpiry: "2025-06-20",
    outstandingBalance: 45000,
  },
  {
    id: "CORP-002",
    companyName: "Dashen Bank",
    contactPerson: "Yohannes Desta",
    email: "procurement@dashenbank.com",
    phone: "+251 115 151 151",
    contractNumber: "DB-2024-002",
    creditLimit: 300000,
    paymentTerms: "Net 45",
    status: "Active",
    registrationDate: "2023-09-15",
    lastOrderDate: "2024-12-12",
    totalOrders: 89,
    totalSpent: 780000,
    contractExpiry: "2025-09-15",
    outstandingBalance: 12000,
  },
  {
    id: "CORP-003",
    companyName: "Commercial Bank of Ethiopia",
    contactPerson: "Marta Tadesse",
    email: "logistics@cbe.com.et",
    phone: "+251 115 515 515",
    contractNumber: "CBE-2024-003",
    creditLimit: 750000,
    paymentTerms: "Net 60",
    status: "Active",
    registrationDate: "2023-12-01",
    lastOrderDate: "2024-12-10",
    totalOrders: 234,
    totalSpent: 2100000,
    contractExpiry: "2025-12-01",
    outstandingBalance: 0,
  },
  {
    id: "CORP-004",
    companyName: "Ethiopian Electric Power",
    contactPerson: "Dawit Alemu",
    email: "procurement@eep.gov.et",
    phone: "+251 115 550 550",
    contractNumber: "EEP-2024-004",
    creditLimit: 1000000,
    paymentTerms: "Net 30",
    status: "Active",
    registrationDate: "2024-01-15",
    lastOrderDate: "2024-12-05",
    totalOrders: 67,
    totalSpent: 890000,
    contractExpiry: "2026-01-15",
    outstandingBalance: 25000,
  },
  {
    id: "CORP-005",
    companyName: "Ethiopian Airlines Cargo",
    contactPerson: "Henok Tadesse",
    email: "cargo@ethiopianairlines.com",
    phone: "+251 115 517 517",
    contractNumber: "EAC-2024-005",
    creditLimit: 200000,
    paymentTerms: "Net 15",
    status: "Suspended",
    registrationDate: "2024-03-10",
    lastOrderDate: "2024-10-15",
    totalOrders: 23,
    totalSpent: 340000,
    contractExpiry: "2025-03-10",
    outstandingBalance: 150000,
  },
];

const metrics = [
  {
    title: "Total Corporate Clients",
    value: "58",
    change: "12 new this month",
    trend: "up",
    icon: <Building2 className="h-5 w-5" />,
    color: "blue",
  },
  {
    title: "Active Contracts",
    value: "52",
    change: "90% active rate",
    trend: "up",
    icon: <FileText className="h-5 w-5" />,
    color: "green",
  },
  {
    title: "Total Credit Limit",
    value: "15.2M ETB",
    change: "2.1M increase",
    trend: "up",
    icon: <CreditCard className="h-5 w-5" />,
    color: "purple",
  },
  {
    title: "Outstanding Balance",
    value: "2.1M ETB",
    change: "15% of limit",
    trend: "down",
    icon: <Calendar className="h-5 w-5" />,
    color: "orange",
  },
];

export default function CorporateClients() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  // Calculate pagination
  const totalItems = corporateClients.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedClients = corporateClients.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Suspended":
        return "bg-red-100 text-red-700";
      case "Expired":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
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
                    <IoBusiness className="text-purple-500" />
                    Corporate Clients
                  </h1>
                </div>
                <p className="text-gray-500 text-sm ml-11">
                  Manage corporate accounts, contracts, and credit terms
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Button
                  onClick={() => navigate("/customer/create")}
                  className="bg-purple-500 hover:bg-purple-600 cursor-pointer text-white"
                >
                  <IoAdd className="mr-2 h-4 w-4" />
                  Add Corporate Client
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

            {/* Search */}
            <div className="relative w-80 mb-6">
              <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search corporate clients..."
                className="pl-10 pr-3 w-full py-6"
              />
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
                      Company
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Contact Person
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Contract
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Credit Limit
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Outstanding
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Total Orders
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Contract Expiry
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
                  {paginatedClients.map((client, index) => (
                    <TableRow
                      key={index}
                      className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/customer/details/${client.id}`)}
                    >
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <IoBusiness className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {client.companyName}
                            </span>
                            <div className="text-sm text-gray-500">
                              {client.contractNumber}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {client.contactPerson}
                          </span>
                          <span className="text-sm text-gray-500">
                            {client.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {client.contractNumber}
                          </span>
                          <span className="text-sm text-gray-500">
                            {client.paymentTerms}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {client.creditLimit.toLocaleString()} ETB
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            client.outstandingBalance > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {client.outstandingBalance.toLocaleString()} ETB
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {client.totalOrders}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(client.contractExpiry).toLocaleDateString(
                              "en-GB"
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.ceil(
                              (new Date(client.contractExpiry).getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days left
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(client.status)}
                        >
                          ● {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 px-3 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customer/edit/${client.id}`);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="p-0 px-3 text-red-400 bg-red-50 cursor-not-allowed opacity-60 flex items-center gap-1"
                          >
                            <MdBlock className="h-4 w-4" />
                            Delete
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
