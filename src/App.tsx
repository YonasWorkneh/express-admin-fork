import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SidebarLayout from "./Layout/Layout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import BranchPage from "./pages/Branch/BranchPage";
import CreateBranch from "./pages/Branch/CreateBranchPage";
import AssignBranch from "./pages/Branch/AssignManagerPage";
import RevokeManager from "./pages/Branch/RevokeManagerPage";
import StaffPage from "./pages/Staff/StaffPage";
import CreateStaffPage from "./pages/Staff/CreateStaffPage";
import OrdersPage from "./pages/orders/OrdersPage";
import OrderItemCategoriesPage from "./pages/orders/OrderItemCategoriesPage";
import ServiceTypesPage from "./pages/orders/ServiceTypesPage";
import CreateOrder from "./features/orders/components/CreateOrder";
import OrderDetails from "./features/orders/components/OrderDetails";
import DispatchPage from "./pages/DispatchPage";
import BatchPage from "./pages/Batch/BatchPage";
import CreateBatchPage from "./pages/Batch/CreateBatchPage";
import BatchDetailsPage from "./pages/Batch/BatchDetailsPage";
import OfficerBatchesPage from "./pages/Batch/OfficerBatchesPage";
import FleetPage from "./pages/Fleet/FleetPage";
import CreateVehiclePage from "./pages/Fleet/CreateVehiclePage";
import CreateVehicleTypePage from "./pages/Fleet/CreateVehicleTypePage";
import EditVehicleTypePage from "./pages/Fleet/EditVehicleTypePage";
import EditVehiclePage from "./pages/Fleet/EditVehiclePage";
import MaintenanceLogPage from "./pages/Fleet/MaintenanceLogPage";
import EditStaffPage from "./pages/Staff/EditStaffPage";
import EditBranchPage from "./pages/Branch/EditBranchPage";
import CreateMaintenanceLogPage from "./pages/Fleet/CreateMaintenanceLogPage";
import EditMaintenanceLogPage from "./pages/Fleet/EditMaintenanceLogPage";
import VehicleDetailsPage from "./pages/Fleet/VehicleDetailsPage";
import StaffDetailsPage from "./pages/Staff/StaffDetailsPage";
import BranchDetailsPage from "./pages/Branch/BranchDetailsPage";
import CustomerDetailsPage from "./pages/Customer/CustomerDetailsPage";
import CustomerPage from "./pages/Customer/CustomerPage";
import CreateCustomerPage from "./pages/Customer/CreateCustomerPage";
import EditCustomerPage from "./pages/Customer/EditCustomerPage";
import CorporateClientsPage from "./pages/Customer/CorporateClientsPage";
import LoyaltyProgramPage from "./pages/Customer/LoyaltyProgramPage";
import ComplaintsPage from "./pages/Customer/ComplaintsPage";
import AddPointsPage from "./pages/Customer/AddPointsPage";
import CreateComplaintPage from "./pages/Customer/CreateComplaintPage";
import PricingPage from "./pages/PricingPage";
import RolesPage from "./pages/Roles/RolesPage";
import PermissionsPage from "./pages/Roles/PermissionsPage";
import CreateRolePage from "./pages/Roles/CreateRolePage";
import CreatePermissionPage from "./pages/Roles/CreatePermissionPage";
import RoleDetailsPage from "./pages/Roles/RoleDetailsPage";
import TownPricingPage from "./pages/Pricing/TownPricingPage";
import RegionalPricingPage from "./pages/Pricing/RegionalPricingPage";
import InternationalPricingPage from "./pages/Pricing/InternationalPricingPage";
import DriverCommissionConfigurePage from "./pages/Pricing/DriverCommissionConfigurePage";
import TariffDetailPage from "./pages/Pricing/TariffDetailPage";
import ReportPage from "./pages/Report/ReportPage";
import OrderReportPage from "./pages/Report/OrderReportPage";
import RevenueReportPage from "./pages/Report/RevenueReportPage";
import CustomersReportPage from "./pages/Report/CustomersReportPage";
import BranchOrderReportPage from "./pages/Report/BranchOrderReportPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import ProtectedRoutes from "./components/ProtectedRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAppDispatch } from "./store/hooks";
import { hydrateAuth } from "./features/auth/authSlice";
import { Permission } from "./config/rolePermissions";
import { SocketProvider } from "./lib/socket/SocketContext";
import { Spinner } from "./utils/spinner";
import { logout } from "./utils/auth";
import {
  parseStoredUserAndRole,
  refreshSessionTokens,
} from "./lib/api/authSession";

const queryClient = new QueryClient();

const App = () => {
  const dispatch = useAppDispatch();
  const [authReady, setAuthReady] = useState(false);

  // Hydrate auth from localStorage; refresh tokens when a refresh token exists.
  useEffect(() => {
    void (async () => {
      const at = localStorage.getItem("accessToken");
      const rt = localStorage.getItem("refreshToken");
      if (!at && !rt) {
        setAuthReady(true);
        return;
      }

      const applyHydrate = () => {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        const { user, role } = parseStoredUserAndRole();
        dispatch(
          hydrateAuth({
            user,
            role,
            accessToken,
            refreshToken,
          }),
        );
      };

      if (!at && rt) {
        try {
          const tokens = await refreshSessionTokens(rt);
          localStorage.setItem("accessToken", tokens.accessToken);
          localStorage.setItem("refreshToken", tokens.refreshToken);
          applyHydrate();
        } catch {
          logout();
        }
        setAuthReady(true);
        return;
      }

      applyHydrate();

      if (rt) {
        void (async () => {
          try {
            const currentRt = localStorage.getItem("refreshToken");
            if (!currentRt) return;
            const tokens = await refreshSessionTokens(currentRt);
            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);
            const { user, role } = parseStoredUserAndRole();
            dispatch(
              hydrateAuth({
                user,
                role,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              }),
            );
          } catch {
            // keep existing session; axios 401 flow can still refresh later
          }
        })();
      }

      setAuthReady(true);
    })();
  }, [dispatch]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Spinner className="h-10 w-10 text-[#EE1E21]" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Routes>
          <Route path="/" element={<ProtectedRoutes />}>
            <Route index element={<LoginPage />} />
            <Route element={<SidebarLayout />}>
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute requiredPermission={Permission.DASHBOARD}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch"
                element={
                  <ProtectedRoute requiredPermission={Permission.BRANCH}>
                    <BranchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.BRANCH}>
                    <CreateBranch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.BRANCH}>
                    <EditBranchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch/assign-manager"
                element={
                  <ProtectedRoute requiredPermission={Permission.BRANCH}>
                    <AssignBranch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch/revoke-manager"
                element={
                  <ProtectedRoute requiredPermission={Permission.BRANCH}>
                    <RevokeManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branch/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.BRANCH}>
                    <BranchDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute requiredPermission={Permission.STAFF}>
                    <StaffPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.STAFF}>
                    <CreateStaffPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.STAFF}>
                    <EditStaffPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.STAFF}>
                    <StaffDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order"
                element={
                  <ProtectedRoute requiredPermission={Permission.ORDERS}>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order/item-categories"
                element={
                  <ProtectedRoute requiredPermission={Permission.ORDERS}>
                    <OrderItemCategoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/service-types"
                element={
                  <ProtectedRoute requiredPermission={Permission.ORDERS}>
                    <ServiceTypesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order/new"
                element={
                  <ProtectedRoute requiredPermission={Permission.ORDERS}>
                    <CreateOrder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.ORDERS}>
                    <CreateOrder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order/details/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.ORDERS}>
                    <OrderDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dispatch"
                element={
                  <ProtectedRoute requiredPermission={Permission.DISPATCH}>
                    <DispatchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/batch"
                element={
                  <ProtectedRoute requiredPermission={Permission.DISPATCH}>
                    <BatchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/batch/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.DISPATCH}>
                    <CreateBatchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/batch/details/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.DISPATCH}>
                    <BatchDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/batch/officer"
                element={
                  <ProtectedRoute requiredPermission={Permission.DISPATCH}>
                    <OfficerBatchesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <FleetPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <CreateVehiclePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/type/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <CreateVehicleTypePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/type/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <EditVehicleTypePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <EditVehiclePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/maintenance"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <MaintenanceLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/maintenance/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <CreateMaintenanceLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/maintenance/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <EditMaintenanceLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.FLEET}>
                    <VehicleDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <CustomerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/details/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <CustomerDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <CreateCustomerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <EditCustomerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/corporate"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <CorporateClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/loyalty"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <LoyaltyProgramPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/loyalty/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <AddPointsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/loyalty/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <AddPointsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/complaints"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <ComplaintsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/complaints/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.CUSTOMER}>
                    <CreateComplaintPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing"
                element={
                  <ProtectedRoute requiredPermission={Permission.PRICING}>
                    <PricingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing/tariff/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.PRICING}>
                    <TariffDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing/town"
                element={
                  <ProtectedRoute requiredPermission={Permission.PRICING}>
                    <TownPricingPage />
                  </ProtectedRoute>
                }
              />  <Route
              path="/pricing/town/:id"
              element={
                <ProtectedRoute requiredPermission={Permission.PRICING}>
                  <TownPricingPage />
                </ProtectedRoute>
              }
            />
              <Route
                path="/pricing/regional"
                element={
                  <ProtectedRoute requiredPermission={Permission.PRICING}>
                    <RegionalPricingPage />
                  </ProtectedRoute>
                }
              /> <Route
              path="/pricing/regional/:id"
              element={
                <ProtectedRoute requiredPermission={Permission.PRICING}>
                  <RegionalPricingPage />
                </ProtectedRoute>
              }
            />
              <Route
                path="/pricing/international"
                element={
                  <ProtectedRoute requiredPermission={Permission.PRICING}>
                    <InternationalPricingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing/international/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.PRICING}>
                    <InternationalPricingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing/driver-commission-config"
                element={
                  <ProtectedRoute requiredPermission={Permission.PRICING}>
                    <DriverCommissionConfigurePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles"
                element={
                  <ProtectedRoute requiredPermission={Permission.ROLE}>
                    <RolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.ROLE}>
                    <CreateRolePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.ROLE}>
                    <CreateRolePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles/details/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.ROLE}>
                    <RoleDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/permissions"
                element={
                  <ProtectedRoute requiredPermission={Permission.ROLE}>
                    <PermissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/permissions/create"
                element={
                  <ProtectedRoute requiredPermission={Permission.ROLE}>
                    <CreatePermissionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/permissions/edit/:id"
                element={
                  <ProtectedRoute requiredPermission={Permission.ROLE}>
                    <CreatePermissionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute requiredPermission={Permission.REPORT}>
                    <ReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report/orders"
                element={
                  <ProtectedRoute requiredPermission={Permission.REPORT}>
                    <OrderReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report/revenue"
                element={
                  <ProtectedRoute requiredPermission={Permission.REPORT}>
                    <RevenueReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report/customers"
                element={
                  <ProtectedRoute requiredPermission={Permission.REPORT}>
                    <CustomersReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report/branch/:branchId/orders"
                element={
                  <ProtectedRoute requiredPermission={Permission.REPORT}>
                    <BranchOrderReportPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
        <Toaster position="top-center" reverseOrder={false} />
        </SocketProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
