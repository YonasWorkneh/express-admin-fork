import { useState, useEffect } from "react";
import { FaChartLine, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import TablePagination from "@/components/common/TablePagination";
import { Skeleton } from "antd";
import api from "@/lib/api/api";

// TYPES ---------------------------------------------------
interface BranchPerformanceApi {
  branchName: string;
  activeOrders: number;
  completedOrders: number;
  delayedOrders: number;
  revenue: number;
  efficiency: number;
  trend: string;
}

interface BranchData {
  name: string;
  completed: number;
  delayed: number;
  revenue: number;
  efficiency: number;
  trend: "up" | "down";
}

// COMPONENT ------------------------------------------------
const Performance = () => {
  const [data, setData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Sorting
  const [sortColumn, setSortColumn] = useState<keyof BranchData | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // FETCH DATA --------------------------------------------
  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.get("/report/dashboard/branch-performance");

      // Updated for the new API response:
      // response.data.data is an array of BranchPerformanceApi
      const apiData: BranchPerformanceApi[] = res.data.data;

      // Map API → UI compatible format
      const mapped: BranchData[] = apiData.map((item) => ({
        name: item.branchName,
        completed: item.completedOrders,
        delayed: item.delayedOrders,
        revenue: item.revenue,
        efficiency: item.efficiency,
        // Normalizing trend string: anything that's "improving" (case-insensitive) becomes "up", else "down"
        trend:
          typeof item.trend === "string" && item.trend.toLowerCase() === "improving"
            ? "up"
            : "down",
      }));

      setData(mapped);
    } catch (error) {
      console.error("Error fetching branch performance", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  // SORTING LOGIC -----------------------------------------
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return 0;
  });

  // PAGINATION --------------------------------------------
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // SORT HANDLER
  const handleSort = (column: keyof BranchData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  return (
    <div className="w-full bg-white p-6 font-text">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center gap-2">
          <FaChartLine className="text-[#EE1E21]" size={20} />
          <p className="text-base font-bold text-gray-900">
            Branch Performance Overview
          </p>
        </div>
      </div>

      {/* LOADING SKELETON */}
      {loading ? (
        <Card className="p-4">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : (
        <Card className="bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Branch Name <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>

                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("completed")}
                  >
                    Completed Orders <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>

                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("delayed")}
                  >
                    Delayed Orders <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>

                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>

                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("efficiency")}
                  >
                    Efficiency <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>

                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedData.map((city, i) => (
                <TableRow key={i} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{city.name}</TableCell>

                  <TableCell>{city.completed}</TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        city.delayed < 40
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {city.delayed}
                    </Badge>
                  </TableCell>

                  <TableCell>${city.revenue.toLocaleString()}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#EE1E21]/10 rounded-full h-2">
                        <div
                          className="bg-[#EE1E21] h-2 rounded-full"
                          style={{ width: `${city.efficiency}%` }}
                        ></div>
                      </div>
                      <span>{city.efficiency}%</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        city.trend === "up"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {city.trend === "up" ? (
                        <span className="flex items-center gap-1">
                          <FaSortAmountUp className="h-3 w-3" /> Improving
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <FaSortAmountDown className="h-3 w-3" /> Declining
                        </span>
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </Card>
      )}
    </div>
  );
};

export default Performance;
