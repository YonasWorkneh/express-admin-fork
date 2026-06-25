"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IoPerson,
  IoLocation,
  IoCall,
  IoCar,
  IoAdd,
  IoClose,
  IoChevronBack,
  IoChevronForward,
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoDocumentText,
} from "react-icons/io5";

import "leaflet/dist/leaflet.css";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import { StaffDetailDialog } from "@/features/staff/components/StaffDetailDialog";

function staffIdForDriver(driver: Driver): string | null {
  const sid =
    driver.staffId?.trim() ||
    driver.userId?.trim() ||
    driver.user?.id?.trim() ||
    null;
  return sid;
}

// --- Confirmation Modal Component ---
function ConfirmationModal({ open, onClose, onConfirm, title, description, confirming }:any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-gray-800/30 z-40 flex items-center justify-center">
      <div className="bg-white rounded shadow-lg max-w-sm w-full p-6">
        <div className="flex items-center mb-4">
          <IoAlertCircle className="text-yellow-500 mr-2 w-6 h-6" />
          <span className="font-bold text-lg text-gray-900">{title}</span>
        </div>
        <div className="mb-4 text-gray-700">{description}</div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={confirming}>
            Cancel
          </Button>
          <Button
            className="bg-[#EE1E21] text-[#FADF4B] hover:bg-[#cc1a1c]"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? "Approving..." : "Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom driver icon - different colors for INTERNAL and EXTERNAL drivers
const createDriverIcon = (type: string) => {
  const color = type === "INTERNAL" ? "#3b82f6" : "#10b981";
  return L.divIcon({
    className: "custom-driver-icon",
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface Driver {
  id: string;
  userId: string;
  staffId?: string;
  vehicleId: string;
  status: string;
  availablityStatus: string;
  type: "INTERNAL" | "EXTERNAL";
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  licenseIssue?: string | null;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  verifiedByOCR?: boolean;
  currentLat?: number | null;
  currentLon?: number | null;
  updatedAt: string;
  createdBy?: string | null;
  isApproved?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
  };
  vehicles?: Array<{
    id: string;
    model: string;
    plateNumber: string;
    status: string;
  }>;
  performance?: {
    totalOrders: number;
    completedOrders: number;
    failedOrders: number;
    completionRate: string;
  };
}

interface PaginationType {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface DriversMapViewProps {
  onCreateDriver: () => void;
}

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "AVAILABLE":
    case "ONLINE":
      return "bg-green-100 text-green-700";
    case "ON_ROUTE":
    case "ON ROUTE":
      return "bg-blue-100 text-blue-700";
    case "ON_BREAK":
    case "ON BREAK":
      return "bg-yellow-100 text-yellow-700";
    case "OFFLINE":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, k) => k + start);
}
const MAX_PAGE_BUTTONS = 5;

export default function DriversMapView({ onCreateDriver }: DriversMapViewProps) {
  // State for drivers, loading, pagination, etc
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [dispatchProgress] = useState(75);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverLoading, setDriverLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [driverSearch] = useState("");
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [approveDriver, setApproveDriver] = useState<Driver | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [staffProfileDialogId, setStaffProfileDialogId] = useState<
    string | null
  >(null);
  const [staffProfileLicenseFallback, setStaffProfileLicenseFallback] =
    useState<{
      frontImageUrl?: string | null;
      backImageUrl?: string | null;
    } | null>(null);

  const openDriverStaffProfile = (driver: Driver) => {
    const sid = staffIdForDriver(driver);
    if (!sid) return;
    setStaffProfileLicenseFallback({
      frontImageUrl: driver.frontImageUrl,
      backImageUrl: driver.backImageUrl,
    });
    setStaffProfileDialogId(sid);
  };

  // Fetch drivers with pagination, using the format in your real response
  const fetchDrivers = async () => {
    try {
      setDriverLoading(true);

      const res = await api.get<{
        data: {
          drivers: Driver[];
          pagination: PaginationType;
        };
      }>(
        `/staff/driver?page=${currentPage}&pageSize=${pageSize}`
      );

      setDrivers(res.data.data?.drivers || []);
      setPagination(res.data.data?.pagination || null);
      setDriverLoading(false);
    } catch (error: unknown) {
      setDriverLoading(false);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverSearch, currentPage, pageSize]);

  const handleSelectDriver = (driver: Driver) => setSelectedDriver(driver);

  const handleApproveDriver = async (driverId: string) => {
    setIsApproving(true);
    try {
      await api.post("/staff/driver/approve", {
        driverIds: [driverId]
      });
      toast.success("Driver approved successfully");
      setApproveModalOpen(false);
      setApproveDriver(null);
      fetchDrivers();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to approve driver"
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Work directly from pagination object if present.
  const totalDrivers = pagination?.total ?? drivers.length ?? 0;
  const page = pagination?.page ?? currentPage;
  const size = pagination?.pageSize ?? pageSize;
  const totalPages = pagination?.totalPages ?? 1;

  function getVisiblePageNumbers() {
    if (totalPages <= MAX_PAGE_BUTTONS) {
      return range(1, totalPages);
    }
    const half = Math.floor(MAX_PAGE_BUTTONS / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, page + half);
    if (page - half < 1) end = Math.min(totalPages, end + (1 - (page - half)));
    if (page + half > totalPages) start = Math.max(1, start - ((page + half) - totalPages));
    return range(start, end);
  }

  const date = new Date();

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50">
      {/* Left Panel - Driver List */}
      <div className="w-2/5 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Drivers{" "}
              {driverLoading
                ? "..."
                : pagination
                ? `(${pagination.total})`
                : drivers?.length || 0}
            </h2>
            <Button
              onClick={onCreateDriver}
              className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B]"
            >
              <IoAdd className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </div>
        </div>

        {/* Driver List */}
        <div className="flex-1 overflow-y-auto">
          {driverLoading ? (
            // Loading skeleton
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 border-b border-gray-100 animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : drivers && drivers.length > 0 ? (
            drivers.map((driver) => (
              <div
                key={driver.id}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedDriver?.id === driver.id
                    ? "bg-[#EE1E21]/5"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleSelectDriver(driver)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#EE1E21]/10 rounded-full flex items-center justify-center">
                      <IoPerson className="h-5 w-5 text-[#EE1E21]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {driver?.user?.name || "Unknown"}
                        </h3>
                        {(driver?.performance?.totalOrders ?? 0) > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-[#EE1E21]/10 text-[#EE1E21]"
                          >
                            {driver.performance?.totalOrders ?? 0}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {driver?.type || "N/A"}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600">
                            {driver?.performance?.completedOrders || 0}/
                            {driver?.performance?.totalOrders || 0}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-[#EE1E21] h-1 rounded-full"
                              style={{
                                width: `${
                                  (driver?.performance?.totalOrders ?? 0) > 0
                                    ? ((driver.performance?.completedOrders ?? 0) /
                                        (driver.performance?.totalOrders ?? 1)) *
                                      100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                     <div className="flex items-center gap-2">
                       {/* Approval status indicator */}
                       <div className="flex items-center gap-2 mt-2">
                        {driver.isApproved ? (
                          <Badge className="bg-green-100 text-green-700 flex gap-1 items-center">
                            <IoCheckmarkCircle className="inline-block w-4 h-4" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 flex gap-1 items-center">
                            <IoAlertCircle className="inline-block w-4 h-4" />
                            Not Approved
                          </Badge>
                        )}
                      </div>
                      {/* Approve action button */}
                      {!driver.isApproved && (
                        <div className="flex items-center justify-start mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-[#EE1E21]/5 text-[#EE1E21] hover:bg-[#EE1E21]/10"
                            onClick={e => {
                              e.stopPropagation();
                              setApproveModalOpen(true);
                              setApproveDriver(driver);
                            }}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                     </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        title={
                          staffIdForDriver(driver)
                            ? "View full staff profile"
                            : "No staff account linked"
                        }
                        disabled={!staffIdForDriver(driver)}
                        onClick={e => {
                          e.stopPropagation();
                          openDriverStaffProfile(driver);
                        }}
                      >
                        <IoDocumentText className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation();
                          // Handle location tracking
                        }}
                      >
                        <IoLocation className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation();
                          // Handle calling driver
                        }}
                      >
                        <IoCall className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Approval status and Approve button moved under icons for consistency */}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <IoPerson className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">No drivers found</p>
              <p className="text-sm text-gray-400 mt-1">
                Add a new driver to get started
              </p>
              <Button
                onClick={onCreateDriver}
                className="mt-4 bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B]"
                size="sm"
              >
                <IoAdd className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Info */}
            <p className="text-sm text-gray-500">
              {driverLoading
                ? "Loading..."
                : totalDrivers > 0
                ? `${(page - 1) * size + 1}-${Math.min(page * size, totalDrivers)} of ${totalDrivers} results`
                : "0 results"}
            </p>

            {/* Page Size Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Rows:</span>
              <select
                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none"
                value={size}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                disabled={driverLoading}
              >
                {[2, 10, 20, 30, 50].map(sizeOption => (
                  <option key={sizeOption} value={sizeOption}>
                    {sizeOption}
                  </option>
                ))}
              </select>
            </div>

            {/* Pagination Bar */}
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setCurrentPage(_val => Math.max(1, page - 1))}
                disabled={driverLoading || page <= 1}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <IoChevronBack />
              </Button>
              {totalPages > MAX_PAGE_BUTTONS && getVisiblePageNumbers()[0] > 1 && (
                <button
                  className="h-8 w-8 text-gray-500 text-xs bg-gray-100 rounded"
                  onClick={() => setCurrentPage(1)}
                  disabled={driverLoading}
                >
                  1
                </button>
              )}
              {totalPages > MAX_PAGE_BUTTONS && getVisiblePageNumbers()[0] > 2 && (
                <span className="px-1 text-gray-400">
                  <IoEllipsisHorizontal />
                </span>
              )}
              {getVisiblePageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  className={`h-8 w-8 text-xs rounded ${
                    page === pageNum
                      ? "bg-[#EE1E21] text-[#FADF4B] font-bold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={driverLoading}
                  style={{
                    fontWeight: page === pageNum ? 700 : 400,
                  }}
                >
                  {pageNum}
                </button>
              ))}
              {totalPages > MAX_PAGE_BUTTONS &&
                getVisiblePageNumbers()[getVisiblePageNumbers().length - 1] < totalPages - 1 && (
                  <span className="px-1 text-gray-400">
                    <IoEllipsisHorizontal />
                  </span>
                )}
              {totalPages > MAX_PAGE_BUTTONS &&
                getVisiblePageNumbers()[getVisiblePageNumbers().length - 1] < totalPages && (
                  <button
                    className="h-8 w-8 text-gray-500 text-xs bg-gray-100 rounded"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={driverLoading}
                  >
                    {totalPages}
                  </button>
                )}
              <Button
                onClick={() => setCurrentPage(_val => Math.min(totalPages, page + 1))}
                disabled={driverLoading || page >= totalPages}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <IoChevronForward />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Map and Details */}
      <div className="flex-1 flex flex-col">
        {/* Top Section - Dispatch Overview */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            {/* Dispatch Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    DISPATCH PROGRESS (3)
                  </h3>
                  <span className="text-sm text-gray-500">
                    {dispatchProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#EE1E21] h-2 rounded-full"
                    style={{ width: `${dispatchProgress}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Date */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-2">DATE</h3>
                <p className="text-sm text-gray-600">
                  {date.getDay() +
                    " / " +
                    date.getMonth() +
                    " / " +
                    date.getFullYear()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="flex-1 relative">
          {driverLoading ? (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE1E21] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : null}
          <MapContainer
            center={[9.0192, 38.7525]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {drivers &&
              drivers
                .filter(
                  (driver) =>
                    typeof driver?.currentLat === "number" &&
                    typeof driver?.currentLon === "number" &&
                    driver.currentLat !== null &&
                    driver.currentLon !== null &&
                    !isNaN(driver.currentLat) &&
                    !isNaN(driver.currentLon)
                )
                .map((driver) => (
                  <Marker
                    key={driver.id}
                    position={[
                      Number(driver.currentLat),
                      Number(driver.currentLon),
                    ]}
                    icon={createDriverIcon(driver.type || "EXTERNAL")}
                    eventHandlers={{
                      click: () => handleSelectDriver(driver),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-medium">
                          {driver?.user?.name || "Unknown"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {driver.type || "N/A"}
                        </p>
                        <Badge
                          className={getStatusColor(
                            driver.availablityStatus || driver.status || "OFFLINE"
                          )}
                        >
                          {driver.availablityStatus || driver.status || "OFFLINE"}
                        </Badge>
                        {/* Approval Status inside Popup */}
                        <div className="mt-2">
                          {driver.isApproved ? (
                            <Badge className="bg-green-100 text-green-700 flex gap-1 items-center">
                              <IoCheckmarkCircle className="inline-block w-4 h-4" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 flex gap-1 items-center">
                              <IoAlertCircle className="inline-block w-4 h-4" />
                              Not Approved
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
          </MapContainer>
        </div>

        {/* Bottom Section - Driver Details and Live Feed */}
        {selectedDriver && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className=" flex flex-row justify-end">
              <Button
                variant="outline"
                className="my-2"
                onClick={() => setSelectedDriver(null)}
                size="sm"
              >
                <IoClose className="my-2" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Driver Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    DRIVER DETAILS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-medium">
                      {selectedDriver?.user?.name || "Unknown"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedDriver?.type || "N/A"} • {selectedDriver?.user?.phone || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <IoCall className="h-4 w-4 mr-2" />
                        CALL DRIVER
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <IoLocation className="h-4 w-4 mr-2" />
                        LOCATION
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      title={
                        staffIdForDriver(selectedDriver)
                          ? "Same details as Staff page"
                          : "No staff account linked"
                      }
                      disabled={!staffIdForDriver(selectedDriver)}
                      onClick={() => openDriverStaffProfile(selectedDriver)}
                    >
                      <IoDocumentText className="h-4 w-4 mr-2" />
                      View full staff profile
                    </Button>
                  </div>
                  <div>
                    {/* Approval Status and Approve button in detail view */}
                    <div className="flex items-center gap-2 my-2">
                      {selectedDriver.isApproved ? (
                        <Badge className="bg-green-100 text-green-700 flex gap-1 items-center">
                          <IoCheckmarkCircle className="inline-block w-4 h-4" />
                          Approved
                        </Badge>
                      ) : (
                        <>
                          <Badge className="bg-yellow-100 text-yellow-700 flex gap-1 items-center">
                            <IoAlertCircle className="inline-block w-4 h-4" />
                            Not Approved
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2 bg-[#EE1E21]/5 text-[#EE1E21] hover:bg-[#EE1E21]/10"
                            onClick={() => {
                              setApproveModalOpen(true);
                              setApproveDriver(selectedDriver);
                            }}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      CURRENT ROUTE
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Masonhave</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#EE1E21] rounded-full"></div>
                        <span className="text-sm">Janafort</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Feed */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-900">
                      LIVE FEED
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">LIVE</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                    <div className="text-center">
                      <IoCar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Live camera feed</p>
                      <p className="text-xs text-gray-400">
                        From {selectedDriver?.user?.name || "Unknown"}'s vehicle
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <select className="w-full text-sm border border-gray-200 rounded px-2 py-1">
                      <option>ROAD VIEW</option>
                      <option>DRIVER VIEW</option>
                      <option>REAR VIEW</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <StaffDetailDialog
        staffId={staffProfileDialogId}
        licenseUrlFallback={staffProfileLicenseFallback ?? undefined}
        open={Boolean(staffProfileDialogId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setStaffProfileDialogId(null);
            setStaffProfileLicenseFallback(null);
          }
        }}
      />

      {/* Approval Confirmation Modal */}
      <ConfirmationModal
        open={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setApproveDriver(null);
        }}
        onConfirm={() => {
          if (approveDriver?.id) handleApproveDriver(approveDriver.id);
        }}
        title="Approve Driver"
        description={
          `Are you sure you want to approve this driver${
            approveDriver && approveDriver.user?.name
              ? ` (${approveDriver.user.name})`
              : ""
          }?`
        }
        confirming={isApproving}
      />
    </div>
  );
}
