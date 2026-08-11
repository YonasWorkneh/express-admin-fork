import {
  FaTachometerAlt,
  FaTruck,
  FaExchangeAlt,
  FaCodeBranch,
  FaUsersCog,
  FaTruckLoading,
  FaLock,
  FaShieldAlt,
  FaBoxes,
  FaLayerGroup,
  FaUserCircle,
} from "react-icons/fa";
import { IoPricetags } from "react-icons/io5";
import { IoDocumentText } from "react-icons/io5";
import { Permission } from "@/config/rolePermissions";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <FaTachometerAlt />,
    permission: Permission.DASHBOARD,
  },
  {
    name: "Branch Management",
    path: "/branch",
    icon: <FaCodeBranch />,
    permission: Permission.BRANCH,
  },
  {
    name: "Staff Management",
    path: "/staff",
    icon: <FaUsersCog />,
    permission: Permission.STAFF,
  },
  {
    name: "Order Management",
    path: "/order",
    icon: <FaTruckLoading />,
    permission: Permission.ORDERS,
  },
  {
    name: "Service Type Management",
    path: "/service-types",
    icon: <FaLayerGroup />,
    permission: Permission.ORDERS,
  },
  {
    name: "Dispatch Management",
    path: "/dispatch",
    icon: <FaExchangeAlt />,
    permission: Permission.DISPATCH,
  },
  {
    name: "Batch Management",
    path: "/batch",
    icon: <FaBoxes />,
    permission: Permission.DISPATCH,
  },
  {
    name: "Fleet Management",
    path: "/fleet",
    icon: <FaTruck />,
    permission: Permission.FLEET,
  },
  {
    name: "Customer Management",
    path: "/customer",
    icon: <FaUsersCog />,
    permission: Permission.CUSTOMER,
  },
  {
    name: "Pricing Management",
    path: "/pricing",
    icon: <IoPricetags />,
    permission: Permission.PRICING,
  },
  {
    name: "Report Generation",
    path: "/report",
    icon: <IoDocumentText />,
    permission: Permission.REPORT, // Can be seen by all
    subItems: [
      {
        name: "Analytics",
        path: "/report",
        icon: <IoDocumentText />,
      },
      {
        name: "Order",
        path: "/report/orders",
        icon: <FaTruckLoading />,
      },
      {
        name: "Revenue",
        path: "/report/revenue",
        icon: <IoPricetags />,
      },
      {
        name: "Customer",
        path: "/report/customers",
        icon: <FaUsersCog />,
      },
    ],
  },
  {
    name: "Roles",
    path: "/roles",
    icon: <FaLock />,
    permission: Permission.ROLE,
  },
  {
    name: "Permissions",
    path: "/permissions",
    icon: <FaShieldAlt />,
    permission: Permission.ROLE,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: <FaUserCircle />,
  },

  // {
  //   name: "Alerts",
  //   path: "/alerts",
  //   icon: <FaBell />,
  //   badge: "3",
  //   badgeColor: "bg-red-500",
  //   subItems: [
  //     { name: "Fuel Alerts", path: "/alerts/fuel", icon: <FaGasPump /> },
  //     { name: "Maintenance", path: "/alerts/maintenance", icon: <FaWrench /> },
  //     { name: "Delays", path: "/alerts/delays", icon: <FaBell /> },
  //   ],
  // },
];

export default menuItems;
