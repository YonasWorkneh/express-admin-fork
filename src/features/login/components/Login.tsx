import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { LoginSchema } from "../../auth/schemas/LoginSchema";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  IoShieldCheckmark,
  IoCar,
  IoPerson,
  IoLockClosed,
} from "react-icons/io5";
import { motion } from "framer-motion";
import Loading from "../../../components/common/Loading";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";
import type { LoginResponse } from "@/types/auth";
import { toast } from "react-hot-toast";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/features/auth/authSlice";

const Login = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
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

  const onSuccess = (data: LoginResponse) => {
    setStatus("success");
    setMessage(data.message);

    // Store in localStorage
    localStorage.setItem("accessToken", data.data.tokens.accessToken);
    localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    // Store role object in localStorage if it exists
    if (data.data.user.role) {
      localStorage.setItem("role", JSON.stringify(data.data.user.role));
    }

    // Store in Redux
    dispatch(
      setCredentials({
        user: data.data.user,
        accessToken: data.data.tokens.accessToken,
        refreshToken: data.data.tokens.refreshToken,
      })
    );

    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
    toast.success(data.message);
  };
  const onError = (error: Error) => {
    setStatus("error");
    setMessage(error.message);
    toast.error(error.message);
  };

  const { mutate: login, isPending } = useLogin(onSuccess, onError);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: { email: string; password: string }) => {
    setStatus("submitting");
    setMessage(null);

    login({
      email: values.email,
      password: values.password,
    });
  };

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
              Welcome Back
            </motion.h1>
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            >
              Sign in to your account to continue
            </motion.p>
          </motion.div>

          {/* Message box */}
          {message && (
            <motion.div
              className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
                status === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {message}
            </motion.div>
          )}

          {/* Login Form */}
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
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
                  {...register("email")}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE1E21] focus:border-transparent ${
                    errors.email && touchedFields.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              {errors.email && touchedFields.email && (
                <motion.p
                  className="mt-1 text-sm text-red-600"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {errors.email.message}
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
                  {...register("password")}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE1E21] focus:border-transparent ${
                    errors.password && touchedFields.password
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
              {errors.password && touchedFields.password && (
                <motion.p
                  className="mt-1 text-sm text-red-600"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {errors.password.message}
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
                <motion.input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#EE1E21] border-gray-300 rounded focus:ring-[#EE1E21]"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                />
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
              disabled={status === "submitting" || isPending}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-[#FADF4B] ${
                status === "submitting" || isPending
                  ? "bg-[#EE1E21]/60 cursor-not-allowed"
                  : "bg-[#EE1E21] hover:bg-[#cc1a1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EE1E21]"
              }`}
              variants={inputVariants}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              whileHover={
                status !== "submitting" && !isPending ? { scale: 1.02 } : {}
              }
              whileTap={
                status !== "submitting" && !isPending ? { scale: 0.98 } : {}
              }
            >
              {status === "submitting" || isPending ? (
                <span className="flex items-center gap-2">
                  <Loading />
                  <span>Signing in...</span>
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </motion.form>

          {/* Footer */}
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
        </div>
      </div>
    </div>
  );
};

export default Login;
