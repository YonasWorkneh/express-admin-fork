"use client";

import { useState, useEffect, useMemo } from "react";
import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Button from "@/components/common/Button";
import * as Yup from "yup";
import { IoArrowBack, IoLayers } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  createVehicleType,
  updateVehicleType,
  fetchFleetVehicleTypes,
} from "@/lib/api/fleet";
import { Info } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/utils/spinner";
import { vehicleTypeImageSrc } from "@/lib/vehicleTypeVisual";

const VehicleTypeValidationSchema = Yup.object().shape({
  name: Yup.string().trim().required("Name is required"),
  description: Yup.string().trim(),
});

export type VehicleTypeFormMode = "create" | "edit";

export default function VehicleTypeForm({
  mode,
  vehicleTypeId,
}: {
  mode: VehicleTypeFormMode;
  vehicleTypeId?: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["fleetVehicleTypes"],
    queryFn: fetchFleetVehicleTypes,
    enabled: mode === "edit" && Boolean(vehicleTypeId),
  });

  const vt = useMemo(
    () =>
      mode === "edit" && vehicleTypeId
        ? types.find((t) => t.id === vehicleTypeId)
        : undefined,
    [mode, vehicleTypeId, types],
  );

  const existingIconSrc =
    mode === "edit" && vt ? vehicleTypeImageSrc(vt) : undefined;

  useEffect(() => {
    if (!iconFile) {
      setIconPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(iconFile);
    setIconPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [iconFile]);

  useEffect(() => {
    if (mode !== "edit" || !vehicleTypeId || isLoading) return;
    if (!vt) {
      toast.error("Vehicle type not found.");
      navigate("/fleet");
    }
  }, [mode, vehicleTypeId, isLoading, vt, navigate]);

  const initialValues = useMemo(
    () => ({
      name: vt?.name ?? "",
      description: vt?.description ?? "",
    }),
    [vt?.id, vt?.name, vt?.description],
  );

  const handleSubmit = async (values: typeof initialValues) => {
    if (mode === "create" && !iconFile) {
      toast.error("Please choose an icon image.");
      return;
    }

    try {
      setStatus("submitting");
      if (mode === "create") {
        await createVehicleType({
          name: values.name.trim(),
          description: values.description.trim(),
          icon: iconFile!,
        });
        toast.success("Vehicle type created.");
      } else if (vehicleTypeId) {
        await updateVehicleType(vehicleTypeId, {
          name: values.name.trim(),
          description: values.description.trim(),
          icon: iconFile ?? undefined,
        });
        toast.success("Vehicle type updated.");
      }
      setStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["fleetVehicleTypes"] });
      await queryClient.invalidateQueries({
        queryKey: ["fleetPublicVehicleTypes"],
      });
      navigate("/fleet");
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { message?: unknown } } })
        .response?.data;
      const apiMessage = data?.message;
      const errorText =
        typeof apiMessage === "string" && apiMessage.trim().length > 0
          ? apiMessage
          : mode === "create"
            ? "Could not create vehicle type."
            : "Could not update vehicle type.";
      toast.error(errorText);
      setStatus("error");
      setMessage(errorText);
    } finally {
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  if (mode === "edit" && vehicleTypeId && isLoading) {
    return (
      <div className="flex justify-center items-center py-24 text-gray-600">
        <Spinner className="h-8 w-8 text-blue-600 mr-2" />
        Loading vehicle type…
      </div>
    );
  }

  if (mode === "edit" && vehicleTypeId && !isLoading && !vt) {
    return null;
  }

  const title =
    mode === "create" ? "Add vehicle type" : "Edit vehicle type";
  const iconLabel =
    mode === "create" ? "Icon image *" : "Icon image (optional)";
  const submitLabel =
    mode === "create" ? "Save vehicle type" : "Update vehicle type";

  const previewSrc = iconPreviewUrl ?? existingIconSrc ?? null;
  const showPreview = Boolean(previewSrc);

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={VehicleTypeValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
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
                  <IoLayers className="text-3xl text-blue-500" />
                  <h1 className="text-3xl font-medium text-gray-700">{title}</h1>
                </div>
              </div>
            </header>

            {message && status === "error" && (
              <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 mb-6">
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Vehicle type details</h2>

                <div>
                  <Label className="mb-1">Name *</Label>
                  <Field
                    as={Input}
                    name="name"
                    placeholder="e.g. Automobile"
                    autoComplete="off"
                    className={`py-7 ${
                      errors.name && touched.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && touched.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label className="mb-1">Description</Label>
                  <Field
                    as={Textarea}
                    name="description"
                    placeholder="Short description of this vehicle type"
                    rows={4}
                    className={`min-h-[100px] resize-y ${
                      errors.description && touched.description
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.description && touched.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-1">{iconLabel}</Label>
                  <p
                    className="flex gap-2 rounded-md border border-blue-200/80 bg-blue-50/80 px-3 py-2 text-xs text-blue-900 mb-2"
                    role="note"
                  >
                    <Info
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                      aria-hidden
                    />
                    <span>
                      Prefer a small PNG or WebP with a transparent background.
                      {mode === "edit" &&
                        " Leave empty to keep the current icon."}
                    </span>
                  </p>
                  <Input
                    id="vehicle-type-icon"
                    type="file"
                    accept="image/*"
                    disabled={status === "submitting"}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setIconFile(file);
                    }}
                    className="py-7"
                  />
                  {showPreview && (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-3">
                        <img
                          src={previewSrc!}
                          alt={
                            iconFile
                              ? "New icon preview"
                              : "Current vehicle type icon"
                          }
                          className="max-h-32 max-w-full object-contain"
                        />
                      </div>
                      {iconFile && (
                        <p className="text-xs text-gray-500 truncate">
                          Selected: {iconFile.name}
                        </p>
                      )}
                      {mode === "edit" && !iconFile && existingIconSrc && (
                        <p className="text-xs text-gray-500">
                          Current icon — choose a file above to replace it.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-medium mb-4">
                {mode === "create" ? "Save vehicle type" : "Update vehicle type"}
              </h2>
              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className={`flex-1 cursor-pointer hover:bg-blue-700 ${
                    status === "submitting"
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {status === "submitting" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving…</span>
                    </span>
                  ) : (
                    submitLabel
                  )}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
