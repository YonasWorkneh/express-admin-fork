import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { LoginSchema } from "../schemas/LoginSchema";
import {
  LoginPhoneSchema,
  type LoginPhoneFormValues,
} from "../schemas/LoginPhoneSchema";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  IoShieldCheckmark,
  IoCar,
  IoPerson,
  IoLockClosed,
  IoCallOutline,
} from "react-icons/io5";
import { motion } from "framer-motion";
import Loading from "../../../components/common/Loading";
import { useNavigate } from "react-router-dom";
import {
  useLogin,
  useConfirmMobileLoginPasswordChange,
  useFirstLoginChangePassword,
  useStaffResendVerification,
  type LoginMutationVariables,
} from "@/hooks/useAuth";
import type { LoginResponse } from "@/types/auth";
import { toast } from "react-hot-toast";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/features/auth/authSlice";
import {
  loginRequiresPasswordChange,
  loginHasAuthenticatedTokens,
  normalizeLoginResponse,
} from "@/lib/api/auth";
import {
  PasswordChangeConfirmSchema,
  type PasswordChangeConfirmValues,
} from "../schemas/PasswordChangeConfirmSchema";

type PendingPasswordIdentity =
  | { type: "email"; value: string }
  | { type: "phone"; value: string };

const ETHIO_COUNTRY_DISPLAY = "+251";

/** Only digits; first digit must be 7 or 9; max 9 digits total. */
function normalizeEthioMobileLocalInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let out = "";
  for (let i = 0; i < digits.length && out.length < 9; i++) {
    const ch = digits[i]!;
    if (out.length === 0) {
      if (ch === "7" || ch === "9") out += ch;
    } else {
      out += ch;
    }
  }
  return out;
}

/** Limits input to six characters — any characters allowed (paste-friendly). */
function takeFirstSixChars(raw: string): string {
  return raw.slice(0, 6);
}

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [signInTab, setSignInTab] = useState<"email" | "phone">("email");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authStep, setAuthStep] = useState<"signIn" | "confirmEmail">("signIn");
  const [pendingPasswordIdentity, setPendingPasswordIdentity] =
    useState<PendingPasswordIdentity | null>(null);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const headingVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  };

  const serviceVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  const completeSignIn = (data: LoginResponse) => {
    if (!loginHasAuthenticatedTokens(data)) {
      setStatus("error");
      toast.error(
        data.message || "Sign-in incomplete. Missing session tokens.",
      );
      return;
    }
    setStatus("success");
    setMessage(data.message);

    localStorage.setItem("accessToken", data.data.tokens.accessToken);
    localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    if (data.data.user.role) {
      localStorage.setItem("role", JSON.stringify(data.data.user.role));
    }

    dispatch(
      setCredentials({
        user: data.data.user,
        accessToken: data.data.tokens.accessToken,
        refreshToken: data.data.tokens.refreshToken,
      }),
    );

    setTimeout(() => navigate("/dashboard"), 1500);
    toast.success(data.message);
  };

  const onLoginSuccess = (
    data: LoginResponse,
    variables: LoginMutationVariables,
  ) => {
    if (loginRequiresPasswordChange(data)) {
      setAuthStep("confirmEmail");
      const identity: PendingPasswordIdentity =
        "email" in variables
          ? { type: "email", value: variables.email.trim() }
          : { type: "phone", value: variables.phone.trim() };
      setPendingPasswordIdentity(identity);
      setStatus("idle");
      setMessage(
        data.message ||
          (identity.type === "phone"
            ? "We sent a verification code to your phone. Enter the 6 characters below with your new password."
            : "We sent a temporary password to your email. Enter it below with your new password."),
      );
      toast.success(
        data.message ||
          (identity.type === "phone"
            ? "Check your phone for the verification code."
            : "Check your email for your temporary password."),
      );
      return;
    }

    const okType = data.data.type === "AUTH_SUCCESS" || data.data.type == null;

    if (okType && loginHasAuthenticatedTokens(data)) {
      completeSignIn(data);
      return;
    }

    setStatus("error");
    setMessage(
      data.message || "Unexpected sign-in response. Please try again.",
    );
    toast.error(data.message || "Unexpected sign-in response.");
  };

  const onConfirmSuccess = (data: LoginResponse) => {
    const normalized = normalizeLoginResponse(data);

    // Prefer completing sign-in when tokens exist (`/staff/verify-email` may use flat token fields).
    if (loginHasAuthenticatedTokens(normalized)) {
      setAuthStep("signIn");
      setPendingPasswordIdentity(null);
      completeSignIn(normalized);
      return;
    }

    if (loginRequiresPasswordChange(normalized)) {
      toast.error(
        normalized.message ||
          "Password change is still required. Check the code and try again.",
      );
      setStatus("error");
      setMessage(normalized.message ?? null);
      return;
    }

    // Password was changed but no session tokens were issued — send the user back to sign in.
    if (normalized.success) {
      setAuthStep("signIn");
      setPendingPasswordIdentity(null);
      resetConfirmForm();
      resetPhoneForm();
      setStatus("success");
      setMessage(
        normalized.message || "Password changed successfully. Please log in again.",
      );
      toast.success(
        normalized.message || "Password changed successfully. Please log in again.",
      );
      return;
    }

    toast.error(normalized.message || "Could not finish sign-in.");
    setStatus("error");
    setMessage(normalized.message ?? null);
  };

  const onError = (error: Error) => {
    setStatus("error");
    setMessage(error.message);
    toast.error(error.message);
  };

  const { mutate: loginMutate, isPending } = useLogin(onLoginSuccess, onError);

  const { mutate: confirmPasswordChangeMutate, isPending: confirmPending } =
    useConfirmMobileLoginPasswordChange(onConfirmSuccess, onError);

  const {
    mutate: firstLoginChangePasswordMutate,
    isPending: firstLoginChangePasswordPending,
  } = useFirstLoginChangePassword(onConfirmSuccess, onError);

  const {
    mutate: resendVerificationMutate,
    isPending: resendVerificationPending,
  } = useStaffResendVerification(
    (res) => {
      toast.success(res.message);
    },
    (err) => {
      toast.error(err.message);
    },
  );

  const {
    register: registerCredentials,
    handleSubmit: handleSubmitCredentials,
    formState: { errors: credentialErrors, touchedFields: credentialTouched },
  } = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register: registerConfirm,
    handleSubmit: handleSubmitConfirm,
    setValue: setConfirmFieldValue,
    formState: { errors: confirmErrors, touchedFields: confirmTouched },
    reset: resetConfirmForm,
  } = useForm<PasswordChangeConfirmValues>({
    resolver: yupResolver(
      PasswordChangeConfirmSchema(
        pendingPasswordIdentity?.type === "email" ? "email" : "phone",
      ),
    ),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    register: registerPhonePassword,
    handleSubmit: handleSubmitPhone,
    control: phoneControl,
    formState: { errors: phoneErrors, touchedFields: phoneTouched },
    reset: resetPhoneForm,
  } = useForm<LoginPhoneFormValues>({
    resolver: yupResolver(LoginPhoneSchema),
    defaultValues: {
      phoneLocal: "",
      password: "",
    },
  });

  const onSubmitCredentials = (values: { email: string; password: string }) => {
    setStatus("submitting");
    setMessage(null);

    loginMutate({
      email: values.email,
      password: values.password,
    });
  };

  const onSubmitPhoneCredentials = (values: LoginPhoneFormValues) => {
    setStatus("submitting");
    setMessage(null);
    const phone = `${ETHIO_COUNTRY_DISPLAY}${values.phoneLocal}`;
    loginMutate({ phone, password: values.password });
  };

  const onSubmitConfirm = (values: PasswordChangeConfirmValues) => {
    if (!pendingPasswordIdentity) {
      toast.error("Missing sign-in context. Go back and sign in again.");
      return;
    }
    setStatus("submitting");
    setMessage(null);
    if (pendingPasswordIdentity.type === "email") {
      firstLoginChangePasswordMutate({
        email: pendingPasswordIdentity.value,
        oldPassword: values.code.trim(),
        newPassword: values.newPassword,
      });
      return;
    }
    confirmPasswordChangeMutate({
      code: values.code,
      newPassword: values.newPassword,
      phone: pendingPasswordIdentity.value,
    });
  };

  const goBackToSignIn = () => {
    setAuthStep("signIn");
    setPendingPasswordIdentity(null);
    setMessage(null);
    setStatus("idle");
    resetConfirmForm();
    resetPhoneForm();
  };

  const busySigningIn =
    authStep === "signIn" && (status === "submitting" || isPending);
  const busyConfirming =
    authStep === "confirmEmail" &&
    (status === "submitting" ||
      confirmPending ||
      firstLoginChangePasswordPending);

  const handleResendVerificationCode = () => {
    if (pendingPasswordIdentity?.type !== "email") return;
    const email = pendingPasswordIdentity.value.trim();
    if (!email) {
      toast.error("Missing email. Go back and sign in again.");
      return;
    }
    resendVerificationMutate(email);
  };

  const verificationCodeRegister = registerConfirm("code");

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Video Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/login.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#EE1E21]/80 to-[#cc1a1c]/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-[#FADF4B] p-12">
          <div className="text-center max-w-md">
            <motion.h1
              className="text-5xl font-bold mb-14 mt-10 ml-3"
              variants={headingVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Express Service
            </motion.h1>
            {/* <p className="text-xl text-blue-100 mb-8">
              Your trusted logistics partner for fast, reliable delivery
              solutions
            </p> */}

            {/* Features */}
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
                variants={serviceVariants}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <IoShieldCheckmark className="h-5 w-5 text-green-300" />
                <span className="text-xl">Secure & Reliable Service</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
                variants={serviceVariants}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <IoCar className="h-5 w-5 text-[#FADF4B]" />
                <span className="text-xl">Fast Delivery Network</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
                variants={serviceVariants}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <IoPerson className="h-5 w-5 text-purple-300" />
                <span className="text-xl">24/7 Customer Support</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div
            className="lg:hidden flex items-center justify-center mb-8"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="bg-[#EE1E21] rounded-2xl p-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IoCar className="h-8 w-8 text-[#FADF4B]" />
            </motion.div>
            <span className="ml-3 text-2xl font-bold text-gray-900">
              Express Service
            </span>
          </motion.div>

          {/* Header */}
          <motion.div
            className="text-center mb-8"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <motion.h1
              className="text-3xl font-bold text-gray-900 mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {authStep === "confirmEmail"
                ? pendingPasswordIdentity?.type === "phone"
                  ? "Verify your phone"
                  : "Confirm your email"
                : "Welcome Back"}
            </motion.h1>
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            >
              {authStep === "confirmEmail" && pendingPasswordIdentity
                ? pendingPasswordIdentity.type === "email"
                  ? `Enter the temporary password sent to ${pendingPasswordIdentity.value} and choose your new password.`
                  : `Enter the 6-character code sent to ${pendingPasswordIdentity.value} and choose your new password.`
                : "Sign in to your account to continue"}
            </motion.p>
          </motion.div>

          {/* Message box */}
          {message && (
            <motion.div
              className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium border ${
                status === "success"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : status === "error"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : authStep === "confirmEmail"
                      ? "bg-[#EE1E21]/5 text-gray-900 border-[#EE1E21]/20"
                      : "bg-gray-50 text-gray-800 border-gray-200"
              }`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {message}
            </motion.div>
          )}

          {authStep === "signIn" ? (
            <>
              <div
                className="flex rounded-lg border border-gray-200 bg-white p-1 mb-6 shadow-sm"
                role="tablist"
                aria-label="Sign in method"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={signInTab === "email"}
                  className={`flex-1 rounded-md py-2.5 px-3 text-sm font-medium transition-colors cursor-pointer ${
                    signInTab === "email"
                      ? "bg-[#EE1E21] text-[#FADF4B] shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSignInTab("email");
                    setMessage(null);
                    setStatus("idle");
                  }}
                >
                  Email
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={signInTab === "phone"}
                  className={`flex-1 rounded-md py-2.5 px-3 text-sm font-medium transition-colors cursor-pointer ${
                    signInTab === "phone"
                      ? "bg-[#EE1E21] text-[#FADF4B] shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSignInTab("phone");
                    setMessage(null);
                    setStatus("idle");
                  }}
                >
                  Phone
                </button>
              </div>

              {signInTab === "email" ? (
                <motion.form
                  key="login-email"
                  onSubmit={handleSubmitCredentials(onSubmitCredentials)}
                  className="space-y-6"
                  autoComplete="off"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                >
                  {/* Email Input */}
                  <motion.div
                    variants={inputVariants}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoPerson className="h-5 w-5 text-gray-400" />
                      </div>
                      <motion.input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        {...registerCredentials("email")}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE1E21] focus:border-transparent ${
                          credentialErrors.email && credentialTouched.email
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        }`}
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    {credentialErrors.email && credentialTouched.email && (
                      <motion.p
                        className="mt-1 text-sm text-red-600"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {credentialErrors.email.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Password Input */}
                  <motion.div
                    variants={inputVariants}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  >
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoLockClosed className="h-5 w-5 text-gray-400" />
                      </div>
                      <motion.input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...registerCredentials("password")}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE1E21] focus:border-transparent ${
                          credentialErrors.password &&
                          credentialTouched.password
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        }`}
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      />
                      <motion.button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-5 w-5" />
                        ) : (
                          <FaEye className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>
                    {credentialErrors.password &&
                      credentialTouched.password && (
                        <motion.p
                          className="mt-1 text-sm text-red-600"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {credentialErrors.password.message}
                        </motion.p>
                      )}
                  </motion.div>

                  {/* Remember me + Forgot password */}
                  <motion.div
                    className="flex items-center justify-between"
                    variants={inputVariants}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                  >
                    <div className="flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Checkbox id="remember-me" name="remember-me" />
                      </motion.div>
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Remember me
                      </label>
                    </div>
                    <div className="text-sm">
                      <motion.a
                        href="#"
                        className="font-medium text-[#EE1E21] hover:text-[#cc1a1c]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        Forgot password?
                      </motion.a>
                    </div>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={busySigningIn}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-[#FADF4B] ${
                      busySigningIn
                        ? "bg-[#EE1E21]/60 cursor-not-allowed"
                        : "bg-[#EE1E21] hover:bg-[#cc1a1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EE1E21]"
                    }`}
                    variants={inputVariants}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
                    whileHover={!busySigningIn ? { scale: 1.02 } : {}}
                    whileTap={!busySigningIn ? { scale: 0.98 } : {}}
                  >
                    {busySigningIn ? (
                      <span className="flex items-center gap-2">
                        <Loading />
                        <span>Signing in...</span>
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="login-phone"
                  onSubmit={handleSubmitPhone(onSubmitPhoneCredentials)}
                  className="space-y-6"
                  autoComplete="off"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                >
                  <motion.div
                    variants={inputVariants}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <label
                      htmlFor="phone-local"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Mobile number
                    </label>
                    <p className="text-xs text-gray-500 mb-2"></p>
                    <div
                      className={`flex rounded-lg border overflow-hidden bg-white focus-within:ring-1 focus-within:ring-[#EE1E21] focus-within:border-transparent ${
                        phoneErrors.phoneLocal && phoneTouched.phoneLocal
                          ? "border-red-500 ring-1 ring-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <span className="flex shrink-0 items-center px-3 py-3 text-sm font-semibold text-gray-800 bg-gray-100 border-r border-gray-200 tabular-nums">
                        {ETHIO_COUNTRY_DISPLAY}
                      </span>
                      <div className="relative flex-1 flex items-center min-w-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IoCallOutline className="h-5 w-5 text-gray-400" />
                        </div>
                        <Controller
                          name="phoneLocal"
                          control={phoneControl}
                          render={({ field }) => (
                            <motion.input
                              {...field}
                              id="phone-local"
                              ref={field.ref}
                              type="text"
                              inputMode="numeric"
                              autoComplete="tel-national"
                              maxLength={9}
                              placeholder="912345678"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(
                                  normalizeEthioMobileLocalInput(
                                    e.target.value,
                                  ),
                                )
                              }
                              className="w-full pl-10 pr-3 py-3 border-0 outline-none text-base tracking-[0.06em]"
                              whileFocus={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        />
                      </div>
                    </div>
                    {phoneErrors.phoneLocal && phoneTouched.phoneLocal && (
                      <motion.p
                        className="mt-1 text-sm text-red-600"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {phoneErrors.phoneLocal.message}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    variants={inputVariants}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  >
                    <label
                      htmlFor="phone-login-password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoLockClosed className="h-5 w-5 text-gray-400" />
                      </div>
                      <motion.input
                        id="phone-login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...registerPhonePassword("password")}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE1E21] focus:border-transparent ${
                          phoneErrors.password && phoneTouched.password
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        }`}
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      />
                      <motion.button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-5 w-5" />
                        ) : (
                          <FaEye className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>
                    {phoneErrors.password && phoneTouched.password && (
                      <motion.p
                        className="mt-1 text-sm text-red-600"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {phoneErrors.password.message}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between"
                    variants={inputVariants}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                  >
                    <div className="flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Checkbox
                          id="remember-me-phone"
                          name="remember-me-phone"
                        />
                      </motion.div>
                      <label
                        htmlFor="remember-me-phone"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Remember me
                      </label>
                    </div>
                    <div className="text-sm">
                      <motion.a
                        href="#"
                        className="font-medium text-[#EE1E21] hover:text-[#cc1a1c]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        Forgot password?
                      </motion.a>
                    </div>
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={busySigningIn}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-[#FADF4B] ${
                      busySigningIn
                        ? "bg-[#EE1E21]/60 cursor-not-allowed"
                        : "bg-[#EE1E21] hover:bg-[#cc1a1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EE1E21]"
                    }`}
                    variants={inputVariants}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
                    whileHover={!busySigningIn ? { scale: 1.02 } : {}}
                    whileTap={!busySigningIn ? { scale: 0.98 } : {}}
                  >
                    {busySigningIn ? (
                      <span className="flex items-center gap-2">
                        <Loading />
                        <span>Signing in...</span>
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </motion.button>
                </motion.form>
              )}
            </>
          ) : (
            <motion.form
              onSubmit={handleSubmitConfirm(onSubmitConfirm)}
              className="space-y-6"
              autoComplete="off"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              <motion.button
                type="button"
                onClick={goBackToSignIn}
                className="text-sm font-medium text-[#EE1E21] hover:text-[#cc1a1c] cursor-pointer"
              >
                ← Back to sign in
              </motion.button>

              <motion.div
                variants={inputVariants}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <label
                  htmlFor="verification-code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {pendingPasswordIdentity?.type === "email"
                    ? "Temporary password"
                    : "Verification code (6 characters)"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IoShieldCheckmark className="h-5 w-5 text-gray-400" />
                  </div>
                  <motion.input
                    id="verification-code"
                    type="text"
                    autoComplete="one-time-code"
                    maxLength={
                      pendingPasswordIdentity?.type === "email" ? undefined : 6
                    }
                    aria-describedby="verification-code-hint"
                    placeholder={
                      pendingPasswordIdentity?.type === "email"
                        ? "Enter temporary password"
                        : "000000"
                    }
                    {...verificationCodeRegister}
                    onChange={(e) => {
                      if (pendingPasswordIdentity?.type !== "email") {
                        e.target.value = takeFirstSixChars(e.target.value);
                      }
                      verificationCodeRegister.onChange(e);
                    }}
                    onPaste={
                      pendingPasswordIdentity?.type === "email"
                        ? undefined
                        : (e) => {
                            e.preventDefault();
                            const text =
                              e.clipboardData.getData("text/plain") || "";
                            const next = takeFirstSixChars(text);
                            setConfirmFieldValue("code", next, {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            });
                          }
                    }
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#EE1E21] focus:border-transparent ${
                      pendingPasswordIdentity?.type === "email"
                        ? "text-left text-base placeholder:text-sm"
                        : "text-center text-lg tracking-[0.35em]"
                    } ${
                      confirmErrors.code && confirmTouched.code
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    id="verification-code-hint"
                    className="text-xs text-gray-500"
                  >
                    {pendingPasswordIdentity?.type === "email"
                      ? "You can paste the temporary password."
                      : "You can paste the code."}
                  </p>
                  {pendingPasswordIdentity?.type === "email" && (
                    <button
                      type="button"
                      onClick={handleResendVerificationCode}
                      disabled={busyConfirming || resendVerificationPending}
                      className="text-sm font-medium text-[#EE1E21] hover:text-[#cc1a1c] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-left sm:text-right shrink-0"
                    >
                      {resendVerificationPending ? "Sending…" : "Resend code"}
                    </button>
                  )}
                </div>
                {confirmErrors.code && confirmTouched.code && (
                  <p className="mt-1 text-sm text-red-600">
                    {confirmErrors.code.message}
                  </p>
                )}
              </motion.div>

              <motion.div
                variants={inputVariants}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
              >
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IoLockClosed className="h-5 w-5 text-gray-400" />
                  </div>
                  <motion.input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    {...registerConfirm("newPassword")}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE1E21] focus:border-transparent ${
                      confirmErrors.newPassword && confirmTouched.newPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNewPassword((v) => !v)}
                  >
                    {showNewPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {confirmErrors.newPassword && confirmTouched.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {confirmErrors.newPassword.message}
                  </p>
                )}
              </motion.div>

              <motion.div
                variants={inputVariants}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              >
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IoLockClosed className="h-5 w-5 text-gray-400" />
                  </div>
                  <motion.input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    {...registerConfirm("confirmPassword")}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE1E21] focus:border-transparent ${
                      confirmErrors.confirmPassword &&
                      confirmTouched.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {confirmErrors.confirmPassword &&
                  confirmTouched.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {confirmErrors.confirmPassword.message}
                    </p>
                  )}
              </motion.div>

              <motion.button
                type="submit"
                disabled={busyConfirming}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-[#FADF4B] ${
                  busyConfirming
                    ? "bg-[#EE1E21]/60 cursor-not-allowed"
                    : "bg-[#EE1E21] hover:bg-[#cc1a1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EE1E21]"
                }`}
                variants={inputVariants}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                whileHover={!busyConfirming ? { scale: 1.02 } : {}}
                whileTap={!busyConfirming ? { scale: 0.98 } : {}}
              >
                {busyConfirming ? (
                  <span className="flex items-center gap-2">
                    <Loading />
                    <span>Saving...</span>
                  </span>
                ) : (
                  "Update password & sign in"
                )}
              </motion.button>
            </motion.form>
          )}

          {authStep === "signIn" ? (
            <motion.div
              className="mt-8 text-center"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
            >
              <motion.p
                className="text-sm text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
              >
                Don't have an account?{" "}
                <motion.a
                  href="#"
                  className="font-medium text-[#EE1E21] hover:text-[#cc1a1c]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  Contact administrator
                </motion.a>
              </motion.p>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Login;
