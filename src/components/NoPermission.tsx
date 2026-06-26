import { useNavigate } from "react-router-dom";
import { ShieldX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NoPermission() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 rounded-full"></div>
              <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-full shadow-lg">
                <ShieldX className="h-16 w-16 text-[#FADF4B]" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Access Denied
              </h1>
              <p className="text-lg text-gray-600">
                You don't have permission to view this page
              </p>
            </div>

            {/* Description */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-red-800">
                This page is restricted to users with specific roles. If you
                believe you should have access, please contact your
                administrator.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-4">
              <Button
                className="flex items-center gap-2 bg-[#EE1E21] hover:bg-[#cc1a1c] cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </div>

            {/* Additional Info */}
            <div className="pt-6 border-t border-gray-200 w-full">
              <p className="text-xs text-gray-500">
                Need help? Contact support at{" "}
                <a
                  href="mailto:support@expressservice.com"
                  className="text-[#EE1E21] hover:underline"
                >
                  support@expressservice.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
