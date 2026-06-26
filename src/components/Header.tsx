import { FaBell, FaBars } from "react-icons/fa";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { toggleSidebar } from "../features/sidebar/sidebarSlice";
import { useNavigate } from "react-router-dom";
import { logout } from "@/utils/auth";
import { useState } from "react";
import { Drawer, List, Badge, Empty, Button, Spin } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import type { Notification } from "../types/types";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function Header() {
  const isCollapsed = useAppSelector((state) => state.sidebar.isCollapsed);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { notifications, notificationsQuery, markAsRead } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    const unread = notifications.filter((n) => !n.read);
    unread.forEach((n) => markAsRead(n.id));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <header
      className={`bg-white font-text border-b border-gray px-3 sm:px-4 lg:px-6 flex justify-between items-center fixed top-0 z-15 transition-all duration-300 ${
        isCollapsed ? "py-3 sm:py-4 left-0 lg:left-20 right-0" : "py-3 sm:py-4 lg:py-5 left-0 lg:left-80 right-0"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 sm:p-3 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-600 hover:text-[#EE1E21] transition-colors"
        >
          <FaBars className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <h2 className="font-semibold text-black text-sm sm:text-base lg:text-lg">
          <span className="hidden md:inline">Courier Management System</span>
          <span className="md:hidden">CMS</span>
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <Badge count={unreadCount} offset={[-5, 5]} style={{ backgroundColor: "#e62727" }}>
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 sm:p-2 rounded-lg text-black hover:bg-gray-100 transition-colors"
          >
            <FaBell className="text-sm sm:text-base" />
          </button>
        </Badge>

        <div className="h-5 sm:h-6 w-px bg-gray-300"></div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-black">Abebe</p>
            <p className="text-xs text-gray-600">Administrator</p>
          </div>
          <div className="relative group pr-1 sm:pr-2">
            <img
              src="https://ui-avatars.com/api/?name=Admin&background=0B1120&color=fff"
              alt="Admin Avatar"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-gray hover:border-[#EE1E21] transition-colors cursor-pointer"
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-3 border-b border-gray-200 text-black">
                <p className="text-sm font-medium text-black">Admin</p>
                <p className="text-xs text-gray-400">admin@horizontech.com</p>
              </div>
              <div className="p-2">
                <button className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                  Profile Settings
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                  Account Settings
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-gray-100 rounded-md cursor-pointer"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        title={
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BellOutlined className="text-[#EE1E21]" />
              <span className="font-semibold text-lg">Notifications</span>
              {unreadCount > 0 && (
                <Badge count={unreadCount} style={{ backgroundColor: "#e62727" }} />
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                type="text"
                size="small"
                onClick={handleMarkAllAsRead}
                className="text-[#EE1E21] hover:text-[#cc1a1c]"
              >
                Mark all as read
              </Button>
            )}
          </div>
        }
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={400}
        className="notification-drawer"
        styles={{
          body: { padding: "16px" },
        }}
      >
        <Spin spinning={notificationsQuery.isLoading || notificationsQuery.isFetching}>
          {notifications.length === 0 && !notificationsQuery.isLoading ? (
            <Empty
              description="No notifications"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              itemLayout="vertical"
              dataSource={notifications}
              renderItem={(item: Notification) => (
                <List.Item
                  className={`px-4 py-3 mb-2 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 ${
                    !item.read
                      ? "bg-red-50 border-red-200"
                      : "bg-white border-gray-200"
                  }`}
                  onClick={() => !item.read && handleMarkAsRead(item.id)}
                >
                  <div className="flex items-start  px-2 justify-between w-full">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`font-semibold text-sm ${getNotificationColor(
                            item.type
                          )}`}
                        >
                          {item.type.replace(/_/g, " ").toUpperCase()}
                        </span>
                        {!item.read && (
                          <span className="w-2 h-2 bg-[#EE1E21] rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                        {item.message}
                      </p>
                   <div className="flex justify-between ">
                   <span className="text-xs text-gray-400">
                        {formatTime(item.createdAt)}
                      </span>
                      <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
                      </span>
                   </div>
                    </div>
                    {!item.read && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id);
                        }}
                        className="text-green-600 hover:text-green-700 flex-shrink-0"
                      />
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Drawer>
    </header>
  );
}
