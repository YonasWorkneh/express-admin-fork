"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { IoClose, IoCheckmarkCircle, IoAdd } from "react-icons/io5";
import { toast } from "react-hot-toast";
import api from "@/lib/api/api";
import type { FleetListResponse, FleetVehicle, RoleWithPermissionsListResponse } from "@/types/types";
import { Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { message } from "antd";

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (driverData: unknown) => void;
}

interface DriverFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  vehicleId: string;
  vehicleName: string;
  type: string;
  notes: string;
  faydaNumber?: string; // Added Fayda Number field (optional to not break code)
}

export default function CreateDriverModal({
  isOpen,
  onClose,
  onSave,
}: CreateDriverModalProps) {
  const [formData, setFormData] = useState<DriverFormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    vehicleId: "",
    vehicleName: "",
    type: "INTERNAL",
    notes: "",
    faydaNumber: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [licenseFiles, setLicenseFiles] = useState<UploadFile[]>([]);
  
  // Vehicle selection states
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Driver role ID (automatically found)
  const [driverRoleId, setDriverRoleId] = useState<string>("");

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!isOpen) return;
      try {
        setLoadingVehicles(true);
        const response = await api.get<FleetListResponse>(
          `/fleet?search=all:${vehicleSearch}&page=1&pageSize=20`
        );
        setVehicles(response.data.data);
        setLoadingVehicles(false);
      } catch (error: unknown) {
        setLoadingVehicles(false);
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Something went wrong. Please try again.";
        toast.error(errorMessage);
      }
    };

    fetchVehicles();
  }, [vehicleSearch, isOpen]);

  // Fetch and find driver role ID
  useEffect(() => {
    const fetchDriverRole = async () => {
      if (!isOpen) return;
      try {
        const response = await api.get<RoleWithPermissionsListResponse>(
          "/access-control/roles?page=1&pageSize=100"
        );
        // Find driver role (case-insensitive search)
        const driverRole = response.data.data.find((role) =>
          role.name.toLowerCase().includes("driver")
        );
        if (driverRole) {
          setDriverRoleId(driverRole.id);
        } else {
          toast.error("Driver role not found. Please contact administrator.");
        }
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Something went wrong. Please try again.";
        toast.error(errorMessage);
      }
    };

    fetchDriverRole();
  }, [isOpen]);

  const handleInputChange = (
    field: keyof DriverFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectVehicle = (vehicle: FleetVehicle) => {
    setFormData((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.model} (${vehicle.plateNumber})`,
    }));
    setVehicleSearch(`${vehicle.model} (${vehicle.plateNumber})`);
    setShowVehicleDropdown(false);
  };

  const clearVehicle = () => {
    setFormData((prev) => ({
      ...prev,
      vehicleId: "",
      vehicleName: "",
    }));
    setVehicleSearch("");
  };

  const dummyRequest = (options: { onSuccess?: (body: unknown) => void }) => {
    const { onSuccess } = options;
    if (onSuccess) {
      setTimeout(() => onSuccess("ok"), 0);
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      message.error("You can only upload image or PDF files!");
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("File must be smaller than 10MB!");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driverRoleId) {
      toast.error("Driver role not found. Please contact administrator.");
      return;
    }
    
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      // Text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("licenseNumber", formData.licenseNumber);
      formDataToSend.append("licenseExpiry", new Date(formData.licenseExpiry).toISOString());
      formDataToSend.append("emergencyContactName", formData.emergencyContactName);
      formDataToSend.append("emergencyContactPhone", formData.emergencyContactPhone);
      formDataToSend.append("vehicleId", formData.vehicleId);
      formDataToSend.append("roleId", driverRoleId);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("isApproved", "true");
      // Add Fayda Number as faydaFAN
      formDataToSend.append("faydaFAN", formData.faydaNumber || "");

      // License images (max 2 files - front and back)
      licenseFiles.forEach((file) => {
        if (file.originFileObj) {
          formDataToSend.append("licenseImages", file.originFileObj as File);
        }
      });

      const res = await api.post("/staff/driver", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res?.data?.message || "Driver created successfully");
      onSave(res.data);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        licenseNumber: "",
        licenseExpiry: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        vehicleId: "",
        vehicleName: "",
        type: "INTERNAL",
        notes: "",
        faydaNumber: "",
      });
      setLicenseFiles([]);
      setVehicleSearch("");
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Something went wrong!";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">
              Add New Driver
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter driver's full name"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="driver@example.com"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2">Phone Number *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+251 9xxxxxxxx"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2">License Number *</Label>
                  <Input
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      handleInputChange("licenseNumber", e.target.value)
                    }
                    placeholder="DL123456789"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2">License Expiry *</Label>
                  <Input
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) =>
                      handleInputChange("licenseExpiry", e.target.value)
                    }
                    required
                  />
                </div>
                {/* Fayda Number Field */}
                <div>
                  <Label className="mb-2">Fayda Number</Label>
                  <Input
                    value={formData.faydaNumber}
                    onChange={(e) =>
                      handleInputChange("faydaNumber", e.target.value)
                    }
                    placeholder="Enter Fayda Number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-2">Driver Type *</Label>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="driverType"
                        value="INTERNAL"
                        checked={formData.type === "INTERNAL"}
                        onChange={(e) =>
                          handleInputChange("type", e.target.value)
                        }
                        className="w-4 h-4 accent-[#EE1E21] border-gray-300 focus:ring-[#EE1E21]"
                      />
                      <span className="text-sm text-gray-700">Internal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="driverType"
                        value="EXTERNAL"
                        checked={formData.type === "EXTERNAL"}
                        onChange={(e) =>
                          handleInputChange("type", e.target.value)
                        }
                        className="w-4 h-4 accent-[#EE1E21] border-gray-300 focus:ring-[#EE1E21]"
                      />
                      <span className="text-sm text-gray-700">External</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Vehicle Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="mb-2">Vehicle *</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search vehicles by model, plate number, or ID..."
                      value={vehicleSearch}
                      onChange={(e) => {
                        setVehicleSearch(e.target.value);
                        setShowVehicleDropdown(true);
                        if (!e.target.value) {
                          clearVehicle();
                        }
                      }}
                      onFocus={() => setShowVehicleDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowVehicleDropdown(false), 200)
                      }
                      className="py-2"
                    />
                    {formData.vehicleId && (
                      <button
                        type="button"
                        onClick={clearVehicle}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                    {showVehicleDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingVehicles ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EE1E21]"></div>
                        </div>
                      ) : vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                          <div
                            key={vehicle.id}
                            onClick={() => selectVehicle(vehicle)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {vehicle.id} | Plate: {vehicle.plateNumber}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No vehicles found
                        </div>
                      )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Emergency Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">Emergency Contact Name *</Label>
                  <Input
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      handleInputChange("emergencyContactName", e.target.value)
                    }
                    placeholder="Enter contact name"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2">Emergency Contact Phone *</Label>
                  <Input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) =>
                      handleInputChange("emergencyContactPhone", e.target.value)
                    }
                    placeholder="+251 9xxxxxxxx"
                    required
                  />
                </div>
              </div>
            </div>

            {/* License Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                License Images
              </h3>
              <div>
                <Label className="mb-2">Upload License (Front & Back) *</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Upload up to 2 images (front and back of license)
                </p>
                <Upload
                  customRequest={dummyRequest}
                  listType="picture-card"
                  maxCount={2}
                  fileList={licenseFiles}
                  onChange={({ fileList }) => setLicenseFiles(fileList)}
                  beforeUpload={beforeUpload}
                  accept="image/*,.pdf"
                >
                  {licenseFiles.length < 2 && (
                    <div className="flex flex-col items-center justify-center">
                      <IoAdd className="h-6 w-6 mb-2" />
                      <span>Upload</span>
                    </div>
                  )}
                </Upload>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Additional Information
              </h3>
              <div>
                <Label className="mb-2">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional notes about the driver..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Driver...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircle className="h-4 w-4 mr-2" />
                    Create Driver
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
