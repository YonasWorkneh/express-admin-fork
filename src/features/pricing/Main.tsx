import {
  Download,
  Package,
  Globe,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MapPin,
  MapPin as LocationIcon,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Spinner } from "@/utils/spinner";
import api from "@/lib/api/api";
import type { Pagination } from "@/types/types";
import toast from "react-hot-toast";
import TablePagination from "@/components/common/TablePagination";

interface PricingParameters {
  title: string;
  icon: React.ReactNode;
  description: string;
}

// Metrics data for dashboard
const metrics = [
  {
    title: "Total Packages",
    value: "24",
    change: "12.5% this month",
    trend: "up",
    color: "blue",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Average Price",
    value: "$35.50",
    change: "8.2% this month",
    trend: "up",
    color: "green",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    title: "Active Zones",
    value: "3",
    change: "No change",
    trend: "up",
    color: "purple",
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    title: "Service Types",
    value: "6",
    change: "2 new this week",
    trend: "up",
    color: "orange",
    icon: <Users className="h-5 w-5" />,
  },
];

// MiniChart component for metrics
const MiniChart = ({ color }: { color: string }) => {
  const colors = {
    blue: "stroke-blue-500",
    green: "stroke-green-500",
    purple: "stroke-purple-500",
    orange: "stroke-orange-500",
  };

  return (
    <svg width="60" height="20" viewBox="0 0 60 20" className="ml-auto">
      <path
        d="M2 18 L8 12 L14 15 L20 8 L26 11 L32 5 L38 9 L44 3 L50 7 L56 2"
        fill="none"
        strokeWidth="1.5"
        className={colors[color as keyof typeof colors]}
      />
      <path
        d="M2 18 L8 12 L14 15 L20 8 L26 11 L32 5 L38 9 L44 3 L50 7 L56 2 L60 20 L2 20 Z"
        fill="currentColor"
        className={`${colors[color as keyof typeof colors]} opacity-10`}
      />
    </svg>
  );
};

// Pricing parameters data
const pricingParameters: Record<string, PricingParameters> = {
  town: {
    title: "Town",
    icon: <Package className="h-6 w-6 text-blue-600" />,
    description: "Local delivery within city limits",
  },
  regional: {
    title: "Regional",
    icon: <LocationIcon className="h-6 w-6 text-purple-600" />,
    description: "Inter-city and regional deliveries",
  },
  international: {
    title: "International",
    icon: <Globe className="h-6 w-6 text-green-600" />,
    description: "Cross-border and international shipping",
  },
};

export default function PricingMain() {
  const navigate = useNavigate();

  const handleNavigateToForm = (zoneKey: string) => {
    const routes: Record<string, string> = {
      town: "/pricing/town",
      regional: "/pricing/regional",
      international: "/pricing/international",
    };
    navigate(routes[zoneKey]);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [fleetLogs,setFleetLogs] =useState<any>([])
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const featchFleetLogs = async (page=1,limit=10) => {
    try {
      setLoading(true);

      const staffs = await api.get<any>(`/pricing/tariff?page=${page}&pageSize=${limit}`);
      setFleetLogs(staffs.data.data?.tariffs);
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
  }, [currentPage,pageSize]);

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

  const handleActivate = async (tariffId: string, shippingScope: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    
    try {
      setActivatingId(tariffId);
      
      // Call activate API
      await api.post(`/pricing/tariff/activate/${tariffId}`, {
        shippingScope: shippingScope
      });
      
      toast.success(`${shippingScope} pricing activated successfully`);
      
      // Refresh the list to get updated active status
      await featchFleetLogs(currentPage, pageSize);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to activate pricing";
      toast.error(message);
      console.error(error);
    } finally {
      setActivatingId(null);
    }
  };
  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Pricing & Tariff Management
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="text-gray-600 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
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
                  <div className="flex items-center space-x-3">
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
                    <MiniChart color={metric.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Zone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.keys(pricingParameters).map((zone) => {
            const param = pricingParameters[zone];
            return (
              <Card
                key={zone}
                className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleNavigateToForm(zone)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">{param.icon}</div>
                  <CardTitle className="text-xl font-bold text-gray-800">
                    {param.title}
                  </CardTitle>
                  <p className="text-sm h-[50px] text-gray-500 mt-2">
                    {param.description}
                  </p>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToForm(zone);
                    }}
                  >
                    Configure {param.title} Pricing
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-8">
          <Card
            className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white"
            onClick={() => navigate("/pricing/driver-commission-config")}
          >
            <CardHeader className="flex flex-row items-center gap-4 sm:gap-6">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 shrink-0">
                <Percent className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">
                  Driver commission configure
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Set driver cost per km, fixed cost, and percentage by vehicle
                  category for each service type — separate from zone tariffs.
                </p>
              </div>
              <Button
                className="shrink-0 bg-blue-600 hover:bg-blue-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/pricing/driver-commission-config");
                }}
              >
                Open
              </Button>
            </CardHeader>
          </Card>
        </div>

        <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("date")}
                    >
                      Name
                    </TableHead>
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("plateNumber")}
                    >
                      Shipping Scope
                    </TableHead>
{/*                   
                    <TableHead className="text-gray-600 font-medium">
                    Service Type
                    </TableHead> */}
                   
                    <TableHead
                      className="text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("cost")}
                    >
                      Currency
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Created Date
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Remark
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex justify-center items-center py-8">
                        <Spinner className="h-6 w-6 text-blue-600 mr-2" />
                        <span className="text-gray-600 font-medium">
                          Loading Pricing data...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                  {(fleetLogs ?? []).map((log: any) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const tid = String(log?.id ?? "").replace(/^#/, "");
                        if (tid) navigate(`/pricing/tariff/${tid}`);
                      }}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
{
  log.name
}                          </span>
                         
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-600">
                            {log?.shippingScope}
                          </span>
                          
                        </div>
                      </TableCell>
                      
                      {/* <TableCell>
                        <div className="flex flex-col max-w-[250px]">
                          <span className="font-medium truncate">
                            {log.serviceType}
                          </span>
                        
                        </div>
                      </TableCell> */}
                     
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {log.currency} 
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[220px]">
                          {(() => {
                            // DEMO: fake random remark for display - always assign a label
                            const demoRemarks = {
                              "Holiday":"bg-red-100 text-red-700",
                              "Event":"bg-purple-100 text-purple-700",
                              "Standard":"bg-blue-100 text-blue-800",
                              "Weekend":"bg-yellow-100 text-yellow-700",
                              "Urgent":"bg-orange-100 text-orange-700",
                              "Maintenance":"bg-gray-100 text-gray-700",
                            }
                            return (
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${demoRemarks[log?.remark as keyof typeof demoRemarks] || "bg-gray-100 text-gray-700"}`}>
                                {log?.remark}
                              </span>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {log.isActive ? (
                            <Badge className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleActivate(log.id, log.shippingScope, e)}
                              disabled={activatingId === log.id}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              {activatingId === log.id ? (
                                <>
                                  <Spinner className="h-3 w-3 mr-1" />
                                  Activating...
                                </>
                              ) : (
                                "Activate"
                              )}
                            </Button>
                          )}
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
            totalPages={pagination?.totalPages||1}
            pageSize={pagination?.pageSize||10}
            totalItems={pagination?.total||0}
            onPageChange={handlePageChange}
            
            onPageSizeChange={handlePageSizeChange}
          />

        {/* Existing Configurations */}
        {/* <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Existing Pricing Configurations
            </h2>
            <Button variant="outline" className="text-gray-600 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export Configurations
            </Button>
          </div>

          <Card className="bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600 font-medium">
                    ID
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Zone
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Service Type
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Weight Range
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Cost/Km
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Profit Margin
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Airport Fee
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Last Updated
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingConfigurations.map((config) => (
                  <TableRow
                    key={config.id}
                    className="border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell className="font-medium text-gray-900">
                      {config.id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          config.zone === "Town"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : config.zone === "Regional"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {config.zone}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {config.serviceType}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {config.weightRange}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {config.costPerKm}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {config.profitMargin}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {config.airportFee || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 hover:bg-green-100"
                      >
                        ● {config.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {config.lastUpdated}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
                        >
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="p-2 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                        >
                          <MdLock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="p-2 text-red-400 bg-red-50 cursor-not-allowed opacity-60"
                        >
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div> */}
      </main>
    </div>
  );
}
