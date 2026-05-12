import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  FileText,
  Calendar,
  Package,
  Users,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Staff, StaffListResponse } from "@/types/types";
import api from "@/lib/api/api";
import { Input } from "@/components/ui/input";
import { useBranchDetail } from "@/hooks/useBranchDetail";
import { Spinner } from "@/utils/spinner";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function BranchDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const branchDetailQuery = useBranchDetail(id);
  const branch = branchDetailQuery.data ?? null;

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchText] = useState("");
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [managerId, setManagerId] = useState("");

  useEffect(() => {
    const mgr = branch?.manager;
    if (mgr && typeof mgr === "object" && "name" in mgr && "id" in mgr) {
      setManagerSearch(
        `${String((mgr as { name: string }).name)} (${String((mgr as { id: string }).id)})`,
      );
    }
  }, [branch]);

  const featchStaffs = async () => {
    try {
      setLoadingStaff(true);

      const staffs = await api.get<StaffListResponse>(
        `/staff?search=all:${searchText}&page=${1}&pageSize=${20}`,
      );
      setStaffs(staffs.data.data);

      toast.success(staffs.data.message);
      setLoadingStaff(false);
    } catch (error: unknown) {
      setLoadingStaff(false);

      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof message === "string" && message.trim()
          ? message
          : "Something went wrong. Please try again.",
      );
      console.error(error);
    }
  };

  useEffect(() => {
    featchStaffs();
  }, [searchText]);

  const selectManager = async (manager: {
    id: string;
    name: string;
    email: string;
  }) => {
    setManagerId(manager.id);
    setManagerSearch(`${manager.name} (${manager.id})`);
    setShowManagerDropdown(false);
    try {
      const data = { managerId: manager.id, branchId: id };

      const res = await api.post("/branch/assign-manager", data);
      toast.success(res.data?.message);
      await branchDetailQuery.refetch();
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof message === "string" && message.trim()
          ? message
          : "Something went wrong!",
      );
    }
  };

  const clearManager = () => {
    setManagerId("");
    setManagerSearch("");
  };

  if (branchDetailQuery.isPending) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Spinner className="h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (branchDetailQuery.isError || !branch) {
    return (
      <div className="min-h-screen p-6 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/branch")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to branches
        </Button>
        <p className="mt-6 text-red-600">
          {branchDetailQuery.error?.message ?? "Could not load branch details."}
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => branchDetailQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const addr = branch.address;
  const staffList = branch.staff ?? [];
  const orderList = branch.orders ?? [];

  return (
    <div className="min-h-screen p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/branch")}
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{branch.name}</h1>
            <p className="text-gray-500 text-sm">
              {branch.branchId} · {branch.location}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-blue-600 border-blue-200"
          onClick={() => navigate(`/branch/edit/${branch.id}`)}
        >
          Edit branch
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Branch information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-gray-600">Display code</Label>
                <p className="font-medium text-gray-900 mt-0.5">
                  {branch.branchId}
                </p>
              </div>
              {/* <div>
                <Label className="text-gray-600">Internal ID</Label>
                <p className="font-mono text-xs text-gray-600 mt-0.5">
                  {branch.id}
                </p>
              </div> */}
              <div>
                <Label className="text-gray-600">Location</Label>
                <p className="text-gray-900 mt-0.5">{branch.location}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {branch.manager ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-2">
                  <p className="font-medium text-gray-900">
                    {branch.manager.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {branch.manager.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {branch.manager.phone}
                  </div>
                  <div className="text-xs font-mono text-gray-500">
                    ID: {branch.manager.id}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No manager assigned.</p>
              )}

              <div className="relative pt-2 border-t">
                <Label className="text-sm font-medium text-gray-600">
                  Assign or change manager
                </Label>
                <div className="relative mt-2">
                  <Input
                    disabled
                    type="text"
                    placeholder="Search staff by name, ID, or email..."
                    value={managerSearch}
                    onChange={(e) => {
                      setManagerSearch(e.target.value);
                      setShowManagerDropdown(true);
                      if (!e.target.value) {
                        clearManager();
                      }
                    }}
                    onFocus={() => setShowManagerDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowManagerDropdown(false), 200)
                    }
                    className="py-7 cursor-not-allowed"
                  />
                  {managerId ? (
                    <button
                      type="button"
                      onClick={() => clearManager()}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>

                {showManagerDropdown ? (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loadingStaff ? (
                      <div className="px-4 py-6 flex justify-center">
                        <Spinner className="h-6 w-6 text-blue-600" />
                      </div>
                    ) : staffs.length > 0 ? (
                      staffs.map((manager) => (
                        <div
                          key={manager.id}
                          onClick={() => selectManager(manager)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {manager.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            ID: {manager.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {manager.email}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center text-sm">
                        No staff found
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Staff ({staffList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {staffList.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No staff on this branch.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {staffList.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/staff/${s.id}`)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col gap-0.5"
                      >
                        <span className="font-medium text-gray-900">
                          {s.name}
                        </span>
                        <span className="text-xs text-gray-500">{s.email}</span>
                        <span className="text-xs text-gray-500">{s.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {addr ? (
                <>
                  <div>
                    <Label className="text-gray-600">Label</Label>
                    <p className="text-gray-900 mt-0.5">{addr.label}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">City</Label>
                    <p className="text-gray-900 mt-0.5">{addr.city}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">State / Region</Label>
                    <p className="text-gray-900 mt-0.5">{addr.state}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Country</Label>
                    <p className="text-gray-900 mt-0.5">{addr.country}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No structured address on record.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Orders ({orderList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderList.length === 0 ? (
                <p className="text-sm text-gray-500">No orders linked.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {orderList.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/order/details/${o.id}`)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left gap-2"
                      >
                        <span className="font-mono text-sm text-gray-900">
                          {o.trackingCode}
                        </span>
                        <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Created</Label>
                  <div className="flex items-center gap-1 mt-1 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(branch.createdAt)}
                  </div>
                </div>
                {/* <div>
                  <Label className="text-gray-600">Created by</Label>
                  <div className="flex items-center gap-1 mt-1 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-xs break-all">
                      {branch.createdBy}
                    </span>
                  </div>
                </div> */}
                <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2 border-t">
                  <span className="text-gray-600">
                    Staff:{" "}
                    <strong className="text-gray-900">
                      {staffList.length}
                    </strong>
                  </span>
                  <span className="text-gray-600">
                    Orders:{" "}
                    <strong className="text-gray-900">
                      {orderList.length}
                    </strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
