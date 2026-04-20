"use client";

import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Button from "@/components/common/Button";
import MapAddressSelector from "@/components/common/MapAddressSelector";
import SuccessModal from "@/components/common/SuccessModal";
import { IoArrowBack, IoLogoDropbox } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import * as Yup from "yup";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type { Customer, CustomerListResponse, Branch, BranchListResponse } from "@/types/types";
import { Spinner } from "@/utils/spinner";
import { Select as Style2 } from "antd";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useOrderItemCategories } from "@/hooks/useOrderItemCategories";
import { usePublicFleetVehicleTypesQuery } from "@/hooks/useDriverCommissionConfig";
import type { FleetVehicleTypeListItem } from "@/lib/api/fleet";
import { VehicleTypeThumbnail } from "@/lib/vehicleTypeVisual";
import { cn } from "@/lib/utils";

// import { useOrders } from "@/hooks/useOrders"; // custom hook

const OrderValidationSchema = Yup.object().shape({
  customerId: Yup.string().required("Customer is required"),
  receiverName: Yup.string().required("Receiver name is required"),
  receiverEmail: Yup.string()
    .email("Invalid email")
    .required("Receiver email is required"),
  receiverPhone: Yup.string().required("Receiver phone is required"),
  receiverAddress: Yup.string().required("Delivery address is required"),
  pickupAddress: Yup.string().required("Pickup address is required"),
  serviceType: Yup.string().required("Service type is required"),
  fulfillmentType: Yup.string().required("Fulfillment type is required"),
  weight: Yup.number()
    .min(0.1, "Weight must be greater than 0")
    .required("Weight is required"),
  destination: Yup.string().required("Destination is required"),
  vehicleTypeIds: Yup.array()
    .of(Yup.string())
    .min(1, "Select at least one vehicle type"),
  // Not required for towns and not globally always required
  // We will do frontend check for these
});

interface ConvertedShipment {
  customerId: any;
  receiverName: any;
  receiverEmail: any;
  receiverPhone: any;
  serviceType: any;
  fulfillmentType: any;
  weight: any;
  category: any[];
  isFragile: any;
  shipmentType: any;
  shippingScope: any;

  pickupAddress: {
    lat: any;
    long: any;
  };

  deliveryAddress: {
    lat: any;
    long: any;
  };

  isUnusual: any;
  unusualReason: any;
  quantity: any;
  // cost: any;
  pickupDate?: any;
  deliveryDate?: any;
  branchId?: any;

  width?: any;
  height?: any;
  length?: any;

  // NEW FIELDS FOR INTERNATIONAL OR REGIONAL ORDERS ONLY
  originCity?: any;
  destinationCity?: any;
  selectedVehicleTypeId?: string;
  vehicleTypeIds?: string[];
}

function VehicleTypeTile({
  vt,
  selected,
  onToggle,
}: {
  vt: FleetVehicleTypeListItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "border rounded-lg p-3 flex flex-col items-center gap-2 transition-colors text-center cursor-pointer",
        selected
          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500"
          : "border-gray-200 hover:border-gray-300 bg-white",
      )}
    >
      <VehicleTypeThumbnail
        vt={vt}
        imgClassName="max-h-14 max-w-14 object-contain"
      />
      <span className="text-xs font-medium text-gray-900 leading-tight line-clamp-2">
        {vt.name}
      </span>
    </button>
  );
}

export default function OrderForm() {
  //   const { createOrder, isCreatingOrder } = useOrders();

  const initialValues = {
    serviceType: "",
    fulfillmentType: "",
    // name: "",
    // email: "",
    // phone: "",
    customerId: "",
    weight: 0,
    quantity: 0,
    category: [],
    isFragile: false,
    shipmentType: "",
    shippingScope: "",
    length: 0,
    width: 0,
    height: 0,
    pickupAddress: "",
    pickupLatitude: 0,
    pickupLongitude: 0,
    cost: 0,
    senderEntity: "",
    isUnusual: false,
    destination: "",
    unusualReason: "",
    // Receiver fields
    receiverName: "",
    receiverEmail: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverLatitude: 0,
    receiverLongitude: 0,
    pickupDate: "",
    deliveryDate: "",
    branchId: "",
    // Add new initial fields
    originCity: "",
    destinationCity: "",
    selectedVehicleTypeId: "",
    vehicleTypeIds: [] as string[],
  };
  const navigate = useNavigate();
  const [estimatePrice, setEstimatePrice] = useState(""); // sample estimate
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const [managerSearch, setManagerSearch] = useState("");
  // const [branchSearch, setBranchSearch] = useState("");
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  // const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  // const [pagination, setPagination] = useState<Pagination | null>(null);
  // const [searchText, setSearchText] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [custoemr, setCustomer] = useState<Customer[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  // Branch selection state (for DROPOFF)
  const [branchSearch, setBranchSearch] = useState("");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const { data: serviceTypes } = useServiceTypes();
  const {
    data: fleetVehicleTypes = [],
    isLoading: loadingVehicleTypes,
    isError: vehicleTypesError,
  } = usePublicFleetVehicleTypesQuery();
  const {
    data: orderItemCategories = [],
    isLoading: loadingOrderItemCategories,
    isError: orderItemCategoriesError,
  } = useOrderItemCategories();

  const featchStaffs = async () => {
    try {
      setLoadingStaff(true);

      const staffs = await api.get<CustomerListResponse>(
        `/users/customers?search=all:${managerSearch}&page=${1}&pageSize=${20}`
      );
      setCustomer(staffs.data.data);
      // setPagination(staffs.data.pagination);
      // toast.success(staffs.data.message);
      setLoadingStaff(false);
    } catch (error: any) {
      setLoadingStaff(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };

  useEffect(() => {
    featchStaffs();
  }, [managerSearch]);

  const fetchBranches = async () => {
    try {
      setLoadingBranch(true);

      const response = await api.get<BranchListResponse>(
        `/branch?search=all:${branchSearch}&page=${1}&pageSize=${20}`
      );
      setBranches(response.data.data);
      setLoadingBranch(false);
    } catch (error: any) {
      setLoadingBranch(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [branchSearch]);
  const onEstimate =async (_values:any) => {
    setPriceLoading(true)
    const converted :ConvertedShipment= {
      // name:_values.name,
      // email:_values.email,
      // phone:_values.phone,

      customerId: _values.customerId,
      // receiver info
      receiverName: _values.receiverName,
      receiverEmail: _values.receiverEmail,
      receiverPhone: _values.receiverPhone,

      // service
      serviceType: _values.serviceType,
      fulfillmentType: _values.fulfillmentType,

      // package details
      weight: _values.weight,
      category: _values.category,
      isFragile: _values.isFragile,
      shipmentType: _values.shipmentType,
      shippingScope: _values.destination,
      // length: _values.length,
      // width: _values.width,
      // height: _values.height,

      // locations (converted to template structure)
      pickupAddress: {
        lat: String(_values.pickupLatitude),
        long: String(_values.pickupLongitude),
      },

      deliveryAddress: {
        lat: String(_values.receiverLatitude),
        long: String(_values.receiverLongitude),
      },

      // unusual item fields
      isUnusual: _values.isUnusual,
      unusualReason: _values.unusualReason,

      // extra from your input (since they exist)
      quantity: _values.quantity,
      // pickupAddressText: _values.pickupAddress,
      // deliveryAddressText: _values.receiverAddress,
      // senderName: _values.name,
      // senderPhone: _values.phone,
      // senderEntity: _values.senderEntity,
      // shippingScope: _values.destination,
      // cost: _values.cost,
      pickupDate: _values.pickupDate ? new Date(_values.pickupDate).toISOString() : undefined,
      deliveryDate: _values.deliveryDate ? new Date(_values.deliveryDate).toISOString() : undefined,
      selectedVehicleTypeId: _values.selectedVehicleTypeId,
      vehicleTypeIds: [...(_values.vehicleTypeIds || [])],
    };

    if ((_values.destination === "REGIONAL" || _values.destination === "INTERNATIONAL")) {
      converted.originCity = _values.originCity;
      converted.destinationCity = _values.destinationCity;
    }

    if (_values.fulfillmentType === "DROPOFF" && _values.branchId) {
      converted.branchId = _values.branchId;
    }

    if(_values.shipmentType=="PARCEL"){
      converted.width= _values?.width
      converted.height= _values?.height
      converted.length= _values?.length

    }
    try {

      const res = await api.post("/pricing/order/summary", converted);
      console.log("res of create order: ", res.data);
      toast.success(res.data?.message);
      console.log("priceeeeeee: ",res.data)
      setEstimatePrice(
        Intl.NumberFormat("en-us", {
          style: "currency",
          currency: res?.data?.data?.result?.currency,
          minimumIntegerDigits: 2,
        }).format(res.data.data?.result?.finalPrice)
      );
      // const tracking = generateTrackingNumber();
      // setTrackingNumber(tracking);
      // setIsSuccessModalOpen(true);
      // resetForm();
      // setEstimatePrice("");
      setPriceLoading(false)
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(error?.response?.data?.message || "Somethign went wrong!");
    } finally {
      setPriceLoading(false)
    }

  };

  const handleSubmit = async (
    _values: any,
    { resetForm }: { resetForm: () => void }
  ) => {
    console.log(
      "-----------------------------------------: ========: ",
      _values
    );
    const converted :ConvertedShipment= {
      // name:_values.name,
      // email:_values.email,
      // phone:_values.phone,

      customerId: _values.customerId,
      // receiver info
      receiverName: _values.receiverName,
      receiverEmail: _values.receiverEmail,
      receiverPhone: _values.receiverPhone,

      // service
      serviceType: _values.serviceType,
      fulfillmentType: _values.fulfillmentType,

      // package details
      weight: _values.weight,
      category: _values.category,
      isFragile: _values.isFragile,
      shipmentType: _values.shipmentType,
      shippingScope: _values.destination,
      // length: _values.length,
      // width: _values.width,
      // height: _values.height,

      // locations (converted to template structure)
      pickupAddress: {
        lat: String(_values.pickupLatitude),
        long: String(_values.pickupLongitude),
      },

      deliveryAddress: {
        lat: String(_values.receiverLatitude),
        long: String(_values.receiverLongitude),
      },

      // unusual item fields
      isUnusual: _values.isUnusual,
      unusualReason: _values.unusualReason,

      // extra from your input (since they exist)
      quantity: _values.quantity,
      // pickupAddressText: _values.pickupAddress,
      // deliveryAddressText: _values.receiverAddress,
      // senderName: _values.name,
      // senderPhone: _values.phone,
      // senderEntity: _values.senderEntity,
      // shippingScope: _values.destination,
      // cost: _values.cost,
      pickupDate: _values.pickupDate ? new Date(_values.pickupDate).toISOString() : undefined,
      deliveryDate: _values.deliveryDate ? new Date(_values.deliveryDate).toISOString() : undefined,
      selectedVehicleTypeId: _values.selectedVehicleTypeId,
      vehicleTypeIds: [...(_values.vehicleTypeIds || [])],
    };

    if ((_values.destination === "REGIONAL" || _values.destination === "INTERNATIONAL")) {
      converted.originCity = _values.originCity;
      converted.destinationCity = _values.destinationCity;
    }

    if (_values.fulfillmentType === "DROPOFF" && _values.branchId) {
      converted.branchId = _values.branchId;
    }

    console.log("values: ", converted);
    if(_values.shipmentType=="PARCEL"){
      converted.width= _values?.width
      converted.height= _values?.height
      converted.length= _values?.length

    }
    try {
      setLoading(true);

      const res = await api.post("/order", converted);
      console.log("res of create order: ", res.data);
      toast.success(res.data?.message);
      // const tracking = generateTrackingNumber();
      setTrackingNumber(res.data.data?.trackingCode);
      setIsSuccessModalOpen(true);
      resetForm();
      setEstimatePrice("");

      setManagerSearch("");
      setBranchSearch("");

    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(error?.response?.data?.message || "Somethign went wrong!");
    } finally {
      setLoading(false);
    }
    // Generate tracking number

    // Show success modal

    // Reset form after a short delay
    // setTimeout(() => {

    // }, 1000);
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    setTrackingNumber("");
  };

  const clearManager = (
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("customerId", "");
    setFieldValue("managerName", "");
    setManagerSearch("");
  };

  const selectManager = (
    manager: { id: string; name: string; email: string },
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("customerId", manager.id);
    setFieldValue("managerName", manager.name);
    setManagerSearch(`${manager.name} (${manager.id})`);
    setShowManagerDropdown(false);
  };

  const clearBranch = (
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("branchId", "");
    setBranchSearch("");
  };

  const selectBranch = (
    branch: { id: string; name: string },
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("branchId", branch.id);
    setBranchSearch(`${branch.name} (${branch.id})`);
    setShowBranchDropdown(false);
  };

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={OrderValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors, touched, setFieldTouched }) => (
          <Form>
            {/* Header */}
            <header className="relative">
              <div className="absolute h-full top-0 left-0 flex items-center">
                <Button
                  type="button"
                  className="!text-white !size-[40px] bg-blue-500 hover:bg-blue-400 !rounded-full !p-0 !py-0 flex items-center justify-center !cursor-pointer"
                  onClick={() => navigate(-1)}
                >
                  <IoArrowBack className="text-white text-lg" />
                </Button>
              </div>
              <div className="flex gap-5 items-center justify-center mb-6">
                <div className="flex gap-4 items-center">
                  <IoLogoDropbox className="text-4xl text-blue-500" />
                  <h1 className="text-3xl font-medium text-gray-700">
                    Place New Order
                  </h1>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Sender Info</h2>
                <div className="bg-gray-50  rounded-lg space-y-4">
                  <div className="relative">
                    <Label className="mb-2">Customer *</Label>
                    <div className="relative">
                      <Input
                        // type="text"
                        placeholder="Search customer "
                        value={managerSearch}
                        onChange={(e) => {
                          console.log(e.target.value);
                          setManagerSearch(e.target.value);
                          setShowManagerDropdown(true);
                          if (!e.target.value) {
                            clearManager(setFieldValue);
                          }
                        }}
                        onFocus={() => setShowManagerDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowManagerDropdown(false), 200)
                        }
                        className="py-7"
                      />
                      {values.customerId && (
                        <button
                          type="button"
                          onClick={() => clearManager(setFieldValue)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {showManagerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingStaff && (
                          <div className="flex justify-center items-center py-8">
                            <Spinner className="h-6 w-6 text-blue-600 mr-2" />
                          </div>
                        )}
                        {custoemr.length > 0 ? (
                          custoemr.map((manager) => (
                            <div
                              key={manager.id}
                              onClick={() =>
                                selectManager(manager, setFieldValue)
                              }
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
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No managers found
                          </div>
                        )}
                      </div>
                    )}
                    {errors.customerId && touched.customerId && (
                      <div className="text-red-500 text-sm mt-1">
                        {errors.customerId}
                      </div>
                    )}
                  </div>
                </div>
                {/* <div>
                  <Label className="mb-1">Name</Label>
                  <Field
                    as={Input}
                    name="name"
                    placeholder="Customer name"
                    className={`py-7 ${
                      errors.name && touched.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && touched.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Email</Label>
                  <Field
                    as={Input}
                    type="email"
                    name="email"
                    placeholder="Email"
                    className={`py-7 ${
                      errors.email && touched.email ? "border-red-500" : ""
                    }`}
                  />
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div> */}

                {/* <Label className="mb-1">Phone</Label>
                  <Field
                    as={Input}
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    className={`py-7 ${
                      errors.phone && touched.phone ? "border-red-500" : ""
                    }`}
                  />
                  {errors.phone && touched.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div> */}
                <div>
                  <Label className="mb-1">Pickup Address</Label>
                  <MapAddressSelector
                    onAddressSelect={(addressData) => {
                      setFieldValue("pickupAddress", addressData.address);
                      setFieldValue("pickupLatitude", addressData.latitude);
                      setFieldValue("pickupLongitude", addressData.longitude);
                    }}
                    initialAddress={values.pickupAddress}
                    initialLat={values.pickupLatitude}
                    initialLng={values.pickupLongitude}
                    height="300px"
                  />
                  {errors.pickupAddress && touched.pickupAddress && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.pickupAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Receiver Info */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Receiver Info</h2>
                <div>
                  <Label className="mb-1">Name</Label>
                  <Field
                    as={Input}
                    name="receiverName"
                    placeholder="Receiver name"
                    className={`py-7 ${
                      errors.receiverName && touched.receiverName
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.receiverName && touched.receiverName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.receiverName}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Email</Label>
                  <Field
                    as={Input}
                    type="email"
                    name="receiverEmail"
                    placeholder="Receiver email"
                    className={`py-7 ${
                      errors.receiverEmail && touched.receiverEmail
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.receiverEmail && touched.receiverEmail && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.receiverEmail}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Phone</Label>
                  <Field
                    as={Input}
                    type="tel"
                    name="receiverPhone"
                    placeholder="Receiver phone"
                    className={`py-7 ${
                      errors.receiverPhone && touched.receiverPhone
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.receiverPhone && touched.receiverPhone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.receiverPhone}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Delivery Address</Label>
                  <MapAddressSelector
                    onAddressSelect={(addressData) => {
                      setFieldValue("receiverAddress", addressData.address);
                      setFieldValue("receiverLatitude", addressData.latitude);
                      setFieldValue("receiverLongitude", addressData.longitude);
                    }}
                    initialAddress={values.receiverAddress}
                    initialLat={values.receiverLatitude}
                    initialLng={values.receiverLongitude}
                    height="300px"
                  />
                  {errors.receiverAddress && touched.receiverAddress && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.receiverAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-medium mb-4">Service Info</h2>

              <div>
                <Label className="mb-1">Service Type</Label>
                <Select
                  value={values.serviceType}
                  onValueChange={(val) => setFieldValue("serviceType", val)}
                >
                  <SelectTrigger
                    className={`py-7 !w-full bg-none border ${
                      errors.serviceType && touched.serviceType
                        ? "border-red-500"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes?.map((serviceType) => (
                      <SelectItem key={serviceType.id} value={serviceType.id}>
                        {serviceType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.serviceType && touched.serviceType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.serviceType}
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1">Courier Collection Type</Label>
                <Select
                  value={values.fulfillmentType}
                  onValueChange={(val) => {
                    setFieldValue("fulfillmentType", val);
                    if (val !== "DROPOFF") {
                      setFieldValue("branchId", "");
                      setBranchSearch("");
                    }
                  }}
                >
                  <SelectTrigger
                    className={`bg-none py-7 !w-full ${
                      errors.fulfillmentType && touched.fulfillmentType
                        ? "border-red-500"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select fulfillment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PICKUP">PICKUP</SelectItem>
                    <SelectItem value="DROPOFF">DROPOFF</SelectItem>
                  </SelectContent>
                </Select>
                {errors.fulfillmentType && touched.fulfillmentType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.fulfillmentType}
                  </p>
                )}
              </div>

              {/* Branch Selection (only for DROPOFF) */}
              {values.fulfillmentType === "DROPOFF" && (
                <div className="relative">
                  <Label className="mb-2">Branch *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Search branch"
                      value={branchSearch}
                      onChange={(e) => {
                        setBranchSearch(e.target.value);
                        setShowBranchDropdown(true);
                        if (!e.target.value) {
                          clearBranch(setFieldValue);
                        }
                      }}
                      onFocus={() => setShowBranchDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowBranchDropdown(false), 200)
                      }
                      className="py-7"
                    />
                    {values.branchId && (
                      <button
                        type="button"
                        onClick={() => clearBranch(setFieldValue)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {showBranchDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingBranch && (
                        <div className="flex justify-center items-center py-8">
                          <Spinner className="h-6 w-6 text-blue-600 mr-2" />
                        </div>
                      )}
                      {branches.length > 0 ? (
                        branches.map((branch) => (
                          <div
                            key={branch.id}
                            onClick={() => selectBranch(branch, setFieldValue)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {branch.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {branch.id}
                            </div>
                            {branch.location && (
                              <div className="text-sm text-gray-500">
                                {branch.location}
                              </div>
                            )}
                          </div>
                        ))
                      ) : !loadingBranch ? (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No branches found
                        </div>
                      ) : null}
                    </div>
                  )}
                  {!values.branchId && values.fulfillmentType === "DROPOFF" && (
                    <p className="text-red-500 text-sm mt-1">
                      Branch is required for DROPOFF orders
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1">Pickup Date</Label>
                  <Field
                    as={Input}
                    type="datetime-local"
                    name="pickupDate"
                    className="py-7"
                  />
                  {errors.pickupDate && touched.pickupDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.pickupDate}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Delivery Date</Label>
                  <Field
                    as={Input}
                    type="datetime-local"
                    name="deliveryDate"
                    className="py-7"
                  />
                  {errors.deliveryDate && touched.deliveryDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.deliveryDate}
                    </p>
                  )}
                </div>
              </div>
              {/* <div>
                <Label className="mb-1">Sender Entity</Label>
                <Select
                  value={String(values.senderEntity)}
                  onValueChange={(val) => setFieldValue("senderEntity", val)}
                >
                  <SelectTrigger className="py-7 !w-full">
                    <SelectValue placeholder="Indvidual/Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Indvidual</SelectItem>
                    <SelectItem value="false">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </div>

            {/* Vehicle types — separate card (not part of service type config) */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm mt-6 space-y-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Vehicle types
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose suitable vehicle categories for this shipment.
                </p>
              </div>

              <div>
                <Label className="mb-2">Selection *</Label>
                {loadingVehicleTypes && (
                  <div className="flex items-center gap-2 py-4 text-gray-600">
                    <Spinner className="h-6 w-6 text-blue-600" />
                    Loading vehicle types…
                  </div>
                )}
                {vehicleTypesError && (
                  <p className="text-red-600 text-sm py-2">
                    Could not load vehicle types.
                  </p>
                )}
                {!loadingVehicleTypes &&
                  !vehicleTypesError &&
                  fleetVehicleTypes.length === 0 && (
                    <p className="text-amber-700 text-sm py-2">
                      No vehicle types available from the public catalog.
                    </p>
                  )}
                {!loadingVehicleTypes && fleetVehicleTypes.length > 0 && (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                    role="group"
                    aria-label="Vehicle types"
                  >
                    {fleetVehicleTypes.map((vt) => {
                      const selected = values.vehicleTypeIds.includes(vt.id);
                      return (
                        <VehicleTypeTile
                          key={vt.id}
                          vt={vt}
                          selected={selected}
                          onToggle={() => {
                            const next = selected
                              ? values.vehicleTypeIds.filter((id) => id !== vt.id)
                              : [...values.vehicleTypeIds, vt.id];
                            setFieldValue("vehicleTypeIds", next);
                            setFieldValue(
                              "selectedVehicleTypeId",
                              next[0] ?? "",
                            );
                            setFieldTouched("vehicleTypeIds", true);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                {errors.vehicleTypeIds && touched.vehicleTypeIds && (
                  <p className="text-red-500 text-sm mt-2">
                    {typeof errors.vehicleTypeIds === "string"
                      ? errors.vehicleTypeIds
                      : "Select at least one vehicle type"}
                  </p>
                )}
              </div>
            </div>

            {/* Shipment Info */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">Shipment Info</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-1">Shipment Type</Label>
                  <Select
                    value={String(values.shipmentType)}
                    onValueChange={(val) => setFieldValue("shipmentType", val)}
                  >
                    <SelectTrigger className="py-7 !w-full">
                      <SelectValue placeholder="Select shipment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARCEL">PARCEL</SelectItem>
                      <SelectItem value="CARRIER">CARRIER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1">Quantity</Label>
                  <Field
                    as={Input}
                    type="number"
                    step="0.1"
                    name="quantity"
                    className={`py-7`}
                  />
                </div>

                <div>
                  <Label className="mb-1">Weight (kg)</Label>
                  <Field
                    as={Input}
                    type="number"
                    step="0.1"
                    name="weight"
                    className={`py-7 ${
                      errors.weight && touched.weight ? "border-red-500" : ""
                    }`}
                  />
                  {errors.weight && touched.weight && (
                    <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                  )}
                </div>
                {values.shipmentType === "PARCEL" ? (
                  <>
                    <div>
                      <Label className="mb-1">Length</Label>
                      <Field
                        as={Input}
                        type="number"
                        step="0.1"
                        name="length"
                        className={`py-7`}
                      />
                    </div>
                    <div>
                      <Label className="mb-1">Width</Label>
                      <Field
                        as={Input}
                        type="number"
                        step="0.1"
                        name="width"
                        className={`py-7`}
                      />
                    </div>
                    <div>
                      <Label className="mb-1">Height</Label>
                      <Field
                        as={Input}
                        type="number"
                        step="0.1"
                        name="height"
                        className={`py-7`}
                      />
                    </div>
                  </>
                ) : (
                  <></>
                )}
                <div>
                  <Label className="mb-1">Category</Label>
                  {loadingOrderItemCategories && (
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-600">
                      <Spinner className="h-5 w-5 text-blue-600" />
                      Loading categories…
                    </div>
                  )}
                  {orderItemCategoriesError && (
                    <p className="text-red-600 text-sm py-2">
                      Could not load item categories.
                    </p>
                  )}
                  {!loadingOrderItemCategories &&
                    !orderItemCategoriesError &&
                    orderItemCategories.length === 0 && (
                      <p className="text-amber-700 text-sm py-2">
                        No item categories configured. Add them under Orders →
                        Item categories.
                      </p>
                    )}
                  <Style2
                    mode="multiple"
                    placeholder="Select category"
                    value={values.category}
                    onChange={(val) => setFieldValue("category", val)}
                    disabled={
                      loadingOrderItemCategories ||
                      orderItemCategories.length === 0
                    }
                    style={{
                      width: "100%",
                      height: 56,
                    }}
                  >
                    {orderItemCategories.map((cat) => (
                      <Style2.Option key={cat.id} value={cat.id}>
                        {cat.name}
                      </Style2.Option>
                    ))}
                  </Style2>
                </div>
                <div>
                  <Label className="mb-1">Fragile</Label>
                  <Select
                    value={String(values.isFragile)}
                    onValueChange={(val) =>
                      setFieldValue("isFragile", val === "true" ? true : false)
                    }
                  >
                    <SelectTrigger className="!w-full py-7">
                      <SelectValue placeholder="Fragile ?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">YES</SelectItem>
                      <SelectItem value="false">NO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1">Unusual Item</Label>
                  <Select
                    value={String(values.isUnusual)}
                    onValueChange={(val) =>
                      setFieldValue(
                        "isUnusual",
                        val === "true" ? true : false
                      )
                    }
                  >
                    <SelectTrigger className="!w-full py-7">
                      <SelectValue placeholder="Is Unusual ?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">YES</SelectItem>
                      <SelectItem value="false">NO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {values.unusualReason ? (
                  <div className="col-span-2">
                    <Label className="mb-1">Unusuality Reason</Label>
                    <Field
                      as={Textarea}
                      cols={15}
                      name="unusualReason"
                      placeholder="Reason for being unusual"
                      className={`py-4 min-h-[80px]`}
                    />
                  </div>
                ) : (
                  <></>
                )}
                <div>
                  <Label className="mb-1">Destination</Label>
                  <Select
                    value={String(values.destination)}
                    onValueChange={(val) => setFieldValue("destination", val)}
                  >
                    <SelectTrigger
                      className={`!w-full py-7 ${
                        errors.destination && touched.destination
                          ? "border-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOWN">TOWN</SelectItem>
                      <SelectItem value="REGIONAL">REGIONAL</SelectItem>
                      <SelectItem value="INTERNATIONAL">
                        INTERNATIONAL
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.destination && touched.destination && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.destination}
                    </p>
                  )}
                </div>
                {/* Origin and Destination City - only for REGIONAL/INTERNATIONAL */}
                {(values.destination === "REGIONAL" || values.destination === "INTERNATIONAL") && (
                  <>
                    <div>
                      <Label className="mb-1">Origin City</Label>
                      <Field
                        as={Input}
                        name="originCity"
                        placeholder="Origin city (ex: Addis Ababa)"
                        className="py-7"
                      />
                    </div>
                    <div>
                      <Label className="mb-1">Destination City</Label>
                      <Field
                        as={Input}
                        name="destinationCity"
                        placeholder="Destination city (ex: Mekelle)"
                        className="py-7"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Action buttons */}

            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">Complete order</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Label
                    className="mb-1 text-lg font-medium"
                    htmlFor="requirement"
                  >
                    Requirement Checklist
                  </Label>
                  <Checkbox className="border-gray-300 ml-2" />
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    className="mb-1 flex flex-row justify-center items-center cursor-pointer hover:bg-blue-700"
                    onClick={() => onEstimate(values)}
                    >
                    {priceLoading?
                            <Spinner className="h-6 w-6 text-center text-white mr-2" />
                    :
                    "Generate Estimate price"}
                  </Button>

                  <Input
                    className="py-7 font-bold !text-2xl border-gray-300"
                    disabled={true}
                    value={estimatePrice}
                  />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 ">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="mb-1 flex flex-row justify-center items-center cursor-pointer hover:bg-blue-700"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center w-full">
                        <Spinner className="h-6 w-6 text-white mr-2" />
                        <span>Submitting...</span>
                      </span>
                    ) : (
                      "Submit order"
                    )}
                  </Button>
                  <Button
                    disabled={loading}
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300 !w-full"
                  >
                    Cancel
                  </Button>
                </div>

              </div>
            </div>
          </Form>
        )}
      </Formik>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        trackingNumber={trackingNumber}
      />
    </div>
  );
}
