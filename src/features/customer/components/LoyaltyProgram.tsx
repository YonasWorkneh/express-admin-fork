"use client";

import { useMemo, useState } from "react";
import { Search, Ticket, Gift, Award, CalendarClock, Copy } from "lucide-react";
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
import { IoAdd, IoStar, IoArrowBack } from "react-icons/io5";
import { Spinner } from "@/utils/spinner";
import { useCoupons } from "@/hooks/useCoupons";
import type { CouponRecord } from "@/lib/api/payment";
import toast from "react-hot-toast";

function couponAssigneeLabel(coupon: CouponRecord): string {
  if (coupon.user?.name) return coupon.user.name;
  if (coupon.corporate?.companyName) return coupon.corporate.companyName;
  if (coupon.corporate?.name) return coupon.corporate.name;
  if (coupon.userId) return `User ${coupon.userId.slice(0, 8)}…`;
  if (coupon.corporateId) return `Corporate ${coupon.corporateId.slice(0, 8)}…`;
  return "—";
}

function couponScope(coupon: CouponRecord): "INDIVIDUAL" | "CORPORATE" | "—" {
  if (coupon.corporateId || coupon.corporate) return "CORPORATE";
  if (coupon.userId || coupon.user) return "INDIVIDUAL";
  return "—";
}

function isCouponExpired(coupon: CouponRecord): boolean {
  if (!coupon.dueDate) return false;
  const due = new Date(coupon.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const endOfDueDay = new Date(due);
  endOfDueDay.setHours(23, 59, 59, 999);
  return endOfDueDay.getTime() < Date.now();
}

function couponStatus(coupon: CouponRecord): "Active" | "Expired" | "Inactive" {
  if (typeof coupon.status === "string" && coupon.status.trim()) {
    const s = coupon.status.toUpperCase();
    if (s.includes("EXPIRE")) return "Expired";
    if (s.includes("INACTIVE") || s.includes("DISABLE") || s.includes("REVOK"))
      return "Inactive";
    if (s.includes("ACTIVE") || s.includes("VALID")) return "Active";
  }
  if (coupon.isActive === false) return "Inactive";
  if (isCouponExpired(coupon)) return "Expired";
  return "Active";
}

function formatMoney(amount: number | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ETB`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LoyaltyProgram() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  const { data: coupons = [], isLoading, isError, refetch, isFetching } =
    useCoupons();

  const filteredCoupons = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const status = couponStatus(coupon);
      if (filterStatus !== "all" && status.toLowerCase() !== filterStatus) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        coupon.code,
        coupon.description,
        couponAssigneeLabel(coupon),
        coupon.user?.email,
        coupon.userId,
        coupon.corporateId,
        String(coupon.creditAmount ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [coupons, filterStatus, searchText]);

  const metrics = useMemo(() => {
    const active = coupons.filter((c) => couponStatus(c) === "Active").length;
    const expired = coupons.filter((c) => couponStatus(c) === "Expired").length;
    const totalCredit = coupons.reduce(
      (sum, c) => sum + (Number(c.creditAmount) || 0),
      0,
    );
    return [
      {
        title: "Total Coupons",
        value: coupons.length,
        icon: <Ticket className="h-5 w-5" />,
      },
      {
        title: "Active Coupons",
        value: active,
        icon: <Award className="h-5 w-5" />,
      },
      {
        title: "Expired Coupons",
        value: expired,
        icon: <CalendarClock className="h-5 w-5" />,
      },
      {
        title: "Credit Issued",
        value: formatMoney(totalCredit),
        icon: <Gift className="h-5 w-5" />,
      },
    ];
  }, [coupons]);

  const totalItems = filteredCoupons.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCoupons = filteredCoupons.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Coupon code copied");
    } catch {
      toast.error("Could not copy code");
    }
  };

  return (
    <div className="min-h-screen">
      <main>
        <Card className="shadow-none border-none">
          <CardContent className="p-6">
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
                    <IoStar className="text-[#EE1E21]" />
                    Credit Program
                  </h1>
                </div>
                <p className="text-gray-500 text-sm ml-11">
                  View and manage credit coupons created for customers
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Button
                  variant="outline"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  className="cursor-pointer"
                >
                  {isFetching ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2 text-[#EE1E21]" />
                      Refreshing…
                    </>
                  ) : (
                    "Refresh"
                  )}
                </Button>
                <Button
                  onClick={() => navigate("/customer/loyalty/create")}
                  className="bg-[#EE1E21] hover:bg-[#cc1a1c] cursor-pointer text-[#FADF4B]"
                >
                  <IoAdd className="mr-2 h-4 w-4" />
                  Add Coupon
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {metrics.map((metric) => (
                <Card key={metric.title} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {metric.value}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#EE1E21]/10 text-[#EE1E21]">
                        {metric.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
                <Input
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search coupons..."
                  className="pl-10 pr-3 w-full py-6"
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value) => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] py-6">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-600 font-medium">
                      Code
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Assignee
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Scope
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Credit amount
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Orders
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Due date
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Status
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10">
                        <div className="flex justify-center items-center gap-2 text-gray-600">
                          <Spinner className="h-6 w-6 text-[#EE1E21]" />
                          Loading coupons…
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-red-600 py-8"
                      >
                        Could not load coupons.{" "}
                        <button
                          type="button"
                          className="underline cursor-pointer"
                          onClick={() => void refetch()}
                        >
                          Try again
                        </button>
                      </TableCell>
                    </TableRow>
                  ) : paginatedCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-gray-500 py-8"
                      >
                        No coupons found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCoupons.map((coupon) => {
                      const status = couponStatus(coupon);
                      const used =
                        coupon.usedOrders ??
                        (typeof coupon.remainingOrders === "number"
                          ? Math.max(
                              0,
                              (coupon.maxOrders || 0) - coupon.remainingOrders,
                            )
                          : null);
                      return (
                        <TableRow
                          key={coupon.id}
                          className="border-gray-100 hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-900 font-mono text-sm">
                                {coupon.code?.trim() || "—"}
                              </span>
                              {coupon.code?.trim() ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-500 hover:text-[#EE1E21]"
                                  aria-label="Copy coupon code"
                                  onClick={() =>
                                    void copyCode(coupon.code!.trim())
                                  }
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              ) : null}
                            </div>
                            {coupon.description ? (
                              <p className="text-xs text-gray-500 mt-0.5 max-w-[220px] truncate">
                                {coupon.description}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {couponAssigneeLabel(coupon)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-slate-100">
                              {couponScope(coupon)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">
                            {formatMoney(Number(coupon.creditAmount))}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {used != null
                              ? `${used} / ${coupon.maxOrders ?? "—"}`
                              : coupon.maxOrders ?? "—"}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatDate(coupon.dueDate)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : status === "Expired"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                              }
                            >
                              ● {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatDate(coupon.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
