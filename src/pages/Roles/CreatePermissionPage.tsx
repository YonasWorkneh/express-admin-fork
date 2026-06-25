import { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/lib/api/api";
import type {
  AccessControlPermissionResponse,
} from "@/types/types";
import { Spinner } from "@/utils/spinner";
import * as Yup from "yup";

const PermissionSchema = Yup.object().shape({
  resource: Yup.string()
    .required("Resource name is required")
    .min(2, "Resource name must be at least 2 characters"),
  description: Yup.string(),
});

const CreatePermissionPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [initialValues, setInitialValues] = useState({
    resource: "",
    description: "",
  });
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      fetchPermission(id);
    }
  }, [isEditMode, id]);

  const fetchPermission = async (permissionId: string) => {
    try {
      setFetching(true);
      const response = await api.get<AccessControlPermissionResponse>(
        `/access-control/permissions/${permissionId}`
      );
      const permission = response.data.data;
      setInitialValues({
        resource: permission.resource,
        description: permission.description || "",
      });
      setFetching(false);
    } catch (error: any) {
      setFetching(false);
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    }
  };

  const handleSubmit = async (values: { resource: string; description: string }) => {
    try {
      setLoading(true);
      if (isEditMode && id) {
        await api.patch(`/access-control/permissions/${id}`, values);
        toast.success("Permission updated successfully");
      } else {
        await api.post("/access-control/permissions", values);
        toast.success("Permission created successfully");
      }
      navigate("/permissions");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8 text-[#EE1E21]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/permissions")}
          className="p-2 hover:bg-gray-100 w-fit flex-shrink-0 h-fit"
        >
          <IoArrowBack className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Edit Permission" : "Create Permission"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isEditMode
              ? "Update permission information"
              : "Create a new permission resource"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-2xl">
        <Formik
          initialValues={initialValues}
          validationSchema={PermissionSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="resource" className="text-sm font-medium text-gray-700">
                  Resource Name <span className="text-red-500">*</span>
                </Label>
                <Field
                  as={Input}
                  id="resource"
                  name="resource"
                  placeholder="e.g., User, Order, Branch"
                  className={`${
                    errors.resource && touched.resource
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
                {errors.resource && touched.resource && (
                  <p className="text-sm text-red-600 mt-1">{errors.resource}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Field
                  as={Textarea}
                  id="description"
                  name="description"
                  placeholder="Describe what this permission resource controls..."
                  rows={4}
                  className={`${
                    errors.description && touched.description
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
                {errors.description && touched.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => navigate("/permissions")}
                  variant="outline"
                  className="w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-2 text-sm font-medium transition-colors shadow-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-auto bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Spinner className="h-4 w-4 text-[#FADF4B] mr-2" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </span>
                  ) : isEditMode ? (
                    "Update Permission"
                  ) : (
                    "Create Permission"
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CreatePermissionPage;
