"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IoClose,
  IoAlertCircle,
  IoCheckmarkCircle,
  IoWarning,
} from "react-icons/io5";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  children:any
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  children
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <IoAlertCircle className="h-6 w-6 text-red-600" />,
          iconBg: "bg-red-100",
          confirmBg: "bg-red-600 hover:bg-red-700",
          confirmText: "text-white",
        };
      case "warning":
        return {
          icon: <IoWarning className="h-6 w-6 text-yellow-600" />,
          iconBg: "bg-yellow-100",
          confirmBg: "bg-yellow-600 hover:bg-yellow-700",
          confirmText: "text-white",
        };
      case "info":
        return {
          icon: <IoCheckmarkCircle className="h-6 w-6 text-[#EE1E21]" />,
          iconBg: "bg-[#EE1E21]/10",
          confirmBg: "bg-[#EE1E21] hover:bg-[#cc1a1c]",
          confirmText: "text-[#FADF4B]",
        };
      default:
        return {
          icon: <IoAlertCircle className="h-6 w-6 text-red-600" />,
          iconBg: "bg-red-100",
          confirmBg: "bg-red-600 hover:bg-red-700",
          confirmText: "text-white",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 -mt-2"
              disabled={isLoading}
            >
              <IoClose className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Icon and Description */}
          <div className="my-2">
            {children}
          </div>
          <div className="flex flex-col items-center text-center">
            {/* <div
              className={`w-16 h-16 ${variantStyles.iconBg} rounded-full flex items-center justify-center mb-4`}
            >
              {variantStyles.icon}
            </div> */}
            <p className="text-gray-600">{description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 cursor-pointer"
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 cursor-pointer ${variantStyles.confirmText} ${variantStyles.confirmBg}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${variant === "info" ? "border-[#FADF4B]" : "border-white"}`}></div>
                  <span>Processing...</span>
                </span>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
