import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import {
  IoEye,
  IoEyeOff,
  IoMailOutline,
  IoCallOutline,
  IoShieldCheckmarkOutline,
  IoPersonOutline,
  IoKeyOutline,
} from "react-icons/io5";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button from "@/components/common/Button";
import api from "@/lib/api/api";
import { useAuthState } from "@/hooks/useAuthState";
import { COMPANY_LOGO_SRC, COMPANY_NAME } from "@/constants/company";

const ChangePasswordSchema = Yup.object().shape({
  oldPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm your new password"),
});

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EE1E21]/10 text-[#EE1E21]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900 truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, roleName } = useAuthState();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name ?? "",
  )}&background=0B1120&color=fff&size=128`;

  const handleChangePassword = async (
    values: { oldPassword: string; newPassword: string; confirmPassword: string },
    { resetForm }: { resetForm: () => void },
  ) => {
    try {
      setSubmitting(true);
      const res = await api.post("/auth/change-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      toast.success(
        (res.data as { message?: string } | undefined)?.message?.trim() ||
          "Password updated successfully.",
      );
      resetForm();
    } catch (error: unknown) {
      const msg =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof msg === "string" && msg.trim()
          ? msg
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white">
      <div className="max-w-4xl space-y-6">
        {/* Profile banner */}
        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
          <div className="bg-gradient-to-r from-[#FADF4B] to-[#f2c94c] px-6 py-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={COMPANY_LOGO_SRC} alt={COMPANY_NAME} className="h-12 w-auto" />
              <div>
                <p className="text-xs font-semibold text-[#8a1a1c] uppercase tracking-wide">
                  {COMPANY_NAME}
                </p>
                <p className="text-sm font-medium text-[#8a1a1c]">My Profile</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-[#8a1a1c]">{user?.name ?? "—"}</p>
                <p className="text-xs text-[#8a1a1c]/80">{roleName ?? "—"}</p>
              </div>
              <img
                src={avatarUrl}
                alt={`${user?.name ?? "User"} avatar`}
                className="h-14 w-14 rounded-full border-4 border-white shadow-sm"
              />
            </div>
          </div>
          <div className="h-1 bg-[#EE1E21]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account information */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-fit">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Account Information
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Your account details, managed by your organization.
            </p>
            <div className="bg-white rounded-lg border border-gray-200 px-4">
              <InfoRow
                icon={<IoPersonOutline />}
                label="Full name"
                value={user?.name ?? ""}
              />
              <InfoRow
                icon={<IoMailOutline />}
                label="Email"
                value={user?.email ?? ""}
              />
              <InfoRow
                icon={<IoCallOutline />}
                label="Phone"
                value={user?.phone ?? ""}
              />
              <InfoRow
                icon={<IoShieldCheckmarkOutline />}
                label="Role"
                value={roleName ?? ""}
              />
            </div>
          </div>

          {/* Change password */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
              <IoKeyOutline className="text-[#EE1E21]" />
              Change Password
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Choose a strong password you don't use elsewhere.
            </p>

            <Formik
              initialValues={{
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
              }}
              validationSchema={ChangePasswordSchema}
              onSubmit={handleChangePassword}
            >
              {({ errors, touched }) => (
                <Form className="space-y-4">
                  <div className="relative">
                    <Label className="mb-1">Current password</Label>
                    <Field
                      as={Input}
                      type={showOld ? "text" : "password"}
                      name="oldPassword"
                      placeholder="Enter current password"
                      className={`py-6 pr-10 ${
                        errors.oldPassword && touched.oldPassword
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={() => setShowOld((v) => !v)}
                      tabIndex={-1}
                    >
                      {showOld ? (
                        <IoEyeOff className="h-5 w-5" />
                      ) : (
                        <IoEye className="h-5 w-5" />
                      )}
                    </button>
                    {errors.oldPassword && touched.oldPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.oldPassword}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Label className="mb-1">New password</Label>
                    <Field
                      as={Input}
                      type={showNew ? "text" : "password"}
                      name="newPassword"
                      placeholder="Enter new password"
                      className={`py-6 pr-10 ${
                        errors.newPassword && touched.newPassword
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                    >
                      {showNew ? (
                        <IoEyeOff className="h-5 w-5" />
                      ) : (
                        <IoEye className="h-5 w-5" />
                      )}
                    </button>
                    {errors.newPassword && touched.newPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Label className="mb-1">Confirm new password</Label>
                    <Field
                      as={Input}
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter new password"
                      className={`py-6 pr-10 ${
                        errors.confirmPassword && touched.confirmPassword
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <IoEyeOff className="h-5 w-5" />
                      ) : (
                        <IoEye className="h-5 w-5" />
                      )}
                    </button>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="!w-full cursor-pointer hover:bg-[#cc1a1c]"
                  >
                    {submitting ? "Updating..." : "Update Password"}
                  </Button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
