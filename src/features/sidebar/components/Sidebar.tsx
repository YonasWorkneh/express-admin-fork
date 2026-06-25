import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { FaChevronDown, FaTimes, FaCodeBranch } from "react-icons/fa";
import menuItems from "../../../constants/AdminSidebar";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { toggleSidebar } from "../sidebarSlice";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/config/rolePermissions";
import { useBranches } from "@/hooks/useBranch";

// Types
interface SubSubItem {
  name: string;
  path: string;
}

interface SubItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
  subsubItems?: SubSubItem[];
  /** Treat pathname as active under this prefix (e.g. /report/branch for branch reports). */
  activePathPrefix?: string;
}

function subSubPathname(fullPath: string): string {
  const i = fullPath.indexOf("?");
  return i === -1 ? fullPath : fullPath.slice(0, i);
}

function pathnameMatchesSubSub(
  pathname: string,
  ssPathWithQuery: string,
): boolean {
  const p = subSubPathname(ssPathWithQuery);
  return pathname === p || pathname.startsWith(p + "/");
}

interface MenuItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
  subItems?: SubItem[];
  permission?: Permission;
}

export default function Sidebar() {
  const location = useLocation();
  const isCollapsed = useAppSelector((state) => state.sidebar.isCollapsed);
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermissions();

  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const prevPathnameRef = useRef<string | null>(null);
  const branchesSubmenuRef = useRef<HTMLDivElement | null>(null);

  // Filter menu items based on user permissions
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      // If no permission is specified, show the item
      if (!item.permission) return true;
      // Check if user has permission
      return hasPermission(item.permission);
    });
  }, [hasPermission]);

  const {
    data: branchesResponse,
    isLoading: branchesLoading,
    isError: branchesError,
  } = useBranches({ page: 1, pageSize: 500 });

  const menuItemsWithReportBranches = useMemo(() => {
    return filteredMenuItems.map((item) => {
      if (item.name !== "Report Generation" || !item.subItems) {
        return item;
      }

      const branchRows = branchesResponse?.data ?? [];
      let subsubItems: SubSubItem[];

      if (branchesLoading) {
        subsubItems = [{ name: "Loading branches…", path: "/branch" }];
      } else if (branchesError) {
        subsubItems = [{ name: "Could not load branches", path: "/branch" }];
      } else if (branchRows.length === 0) {
        subsubItems = [{ name: "No branches found", path: "/branch" }];
      } else {
        subsubItems = branchRows.map((b) => {
          const label = b.name?.trim() || b.customId || "Branch";
          const qs = new URLSearchParams({ branchName: label }).toString();
          return {
            name: label,
            path: `/report/branch/${encodeURIComponent(b.id)}/orders?${qs}`,
          };
        });
      }

      const branchesSubItem: SubItem = {
        name: "Branches",
        path: "/branch",
        icon: <FaCodeBranch />,
        subsubItems,
        activePathPrefix: "/report/branch",
      };

      return {
        ...item,
        subItems: [...item.subItems, branchesSubItem],
      };
    });
  }, [filteredMenuItems, branchesResponse, branchesLoading, branchesError]);

  useEffect(() => {
    if (isCollapsed) {
      setExpandedParent(null);
      setExpandedSub(null);
    }
  }, [isCollapsed]);

  // Auto-expand parent menus when on sub-routes; keep nested (e.g. Branches) open only when that route is active
  useEffect(() => {
    if (isCollapsed) return;

    let nextExpandedSub: string | null = null;

    menuItemsWithReportBranches.forEach((item: MenuItem) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          (sub: SubItem) =>
            location.pathname === sub.path ||
            location.pathname.startsWith(sub.path + "/") ||
            (sub.activePathPrefix &&
              location.pathname.startsWith(sub.activePathPrefix + "/")) ||
            (sub.subsubItems &&
              sub.subsubItems.some((ss: SubSubItem) =>
                pathnameMatchesSubSub(location.pathname, ss.path),
              )),
        );

        if (hasActiveSubItem) {
          setExpandedParent(item.name);

          for (const sub of item.subItems) {
            if (!sub.subsubItems?.length) continue;
            const hasActiveSubSubItem = sub.subsubItems.some((ss: SubSubItem) =>
              pathnameMatchesSubSub(location.pathname, ss.path),
            );
            if (hasActiveSubSubItem) {
              nextExpandedSub = `${item.name}-${sub.name}`;
              break;
            }
          }
        }
      }
    });

    const pathChanged =
      prevPathnameRef.current !== null &&
      prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;

    if (nextExpandedSub !== null) {
      setExpandedSub(nextExpandedSub);
    } else if (pathChanged) {
      setExpandedSub(null);
    }
  }, [location.pathname, isCollapsed, menuItemsWithReportBranches]);

  // Close the Branches nested list on outside click (stay open on branch report routes)
  useEffect(() => {
    if (isCollapsed) return;
    if (expandedSub !== "Report Generation-Branches") return;

    const onPointerDown = (e: PointerEvent) => {
      const el = branchesSubmenuRef.current;
      if (!el?.isConnected) return;
      if (el.contains(e.target as Node)) return;
      if (location.pathname.startsWith("/report/branch/")) return;
      setExpandedSub(null);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isCollapsed, expandedSub, location.pathname]);

  const toggleParent = (name: string) => {
    setExpandedParent((prev) => (prev === name ? null : name));
    setExpandedSub(null);
  };

  const toggleSub = (parent: string, sub: string) => {
    const key = `${parent}-${sub}`;
    setExpandedSub((prev) => (prev === key ? null : key));
  };

  const isMenuItemActive = (itemPath: string, subItems?: SubItem[]) => {
    // For items with sub-items: parent is active only on exact path match
    // (so /report is active on General, but not on /report/orders, /report/revenue, /report/customers)
    if (subItems && subItems.length > 0) {
      return location.pathname === itemPath;
    }

    // No sub-items: active on exact match or when path starts with item path
    if (location.pathname === itemPath) return true;
    if (location.pathname.startsWith(itemPath + "/")) return true;

    return false;
  };

  return (
    <>
      {/* Mobile Overlay - Only visible on mobile when sidebar is open */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/10 z-40 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white text-black h-screen fixed left-0 top-0 z-50 font-text overflow-y-auto border-r border-gray transition-all duration-300 ${
          isCollapsed
            ? "-translate-x-full lg:translate-x-0 lg:w-20"
            : "translate-x-0 w-72 sm:w-80 lg:w-80"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-15 bg-white border-b border-gray-100">
          <div className="relative flex items-center justify-center bg-secondary">
            <img
              src="/images/yes-logo.png"
              alt="Yes Express Service"
              className="w-auto object-cover h-40"
            />
            {!isCollapsed && (
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="lg:hidden absolute right-2 p-2 hover:bg-gray-100/50 rounded-lg text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={`flex flex-col gap-1 sm:gap-2 ${
            isCollapsed ? "p-1 sm:p-2" : "p-2 sm:p-4"
          }`}
        >
          {menuItemsWithReportBranches.map((item: MenuItem) => {
            const { name, path, icon, subItems } = item;
            const isActive = isMenuItemActive(path, subItems);
            const isExpanded = expandedParent === name;

            return (
              <div key={name}>
                {/* Parent */}
                <div
                  className={`flex items-center justify-between cursor-pointer rounded-lg transition-all group ${
                    isActive ? "bg-[#EE1E21]" : "hover:bg-[#EE1E21]"
                  } ${isCollapsed ? "justify-center py-2 sm:py-4" : ""}`}
                  onClick={() => (subItems ? toggleParent(name) : null)}
                >
                  <NavLink
                    to={path}
                    onClick={(e) => subItems && e.preventDefault()}
                    className={`flex items-center gap-2 sm:gap-3 h-full w-full flex-1 p-2 sm:p-3 ${
                      isCollapsed ? "justify-center" : ""
                    }`}
                  >
                    <span
                      className={`text-lg sm:text-2xl ${
                        isActive
                          ? "text-[#FADF4B]"
                          : "text-black group-hover:text-[#FADF4B]"
                      }`}
                    >
                      {icon}
                    </span>
                    {!isCollapsed && (
                      <span
                        className={`${
                          isActive
                            ? "text-[#FADF4B]"
                            : "text-black group-hover:text-[#FADF4B]"
                        } text-xs sm:text-sm`}
                      >
                        {name}
                      </span>
                    )}
                  </NavLink>
                  {!isCollapsed && subItems && (
                    <FaChevronDown
                      className={`text-xs transition-transform group-hover:text-[#FADF4B] mr-1 sm:mr-2 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>

                {/* Sub Items */}
                {subItems && !isCollapsed && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded
                        ? "max-h-[9999px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-4 sm:ml-6 mt-1 sm:mt-2 flex flex-col gap-1 pb-1">
                      {subItems.map((sub) => {
                        const hasSubsub =
                          Array.isArray(sub.subsubItems) &&
                          sub.subsubItems.length > 0;
                        const subKey = `${name}-${sub.name}`;
                        const isSubExpanded = expandedSub === subKey;
                        const isSubActive =
                          // Exact match
                          location.pathname === sub.path ||
                          // For sub-routes (e.g. /report/orders/123), but avoid
                          // treating the parent-like subitem (whose path === item.path)
                          // as active when a deeper sub-route is selected.
                          (sub.path !== path &&
                            location.pathname.startsWith(sub.path + "/")) ||
                          (sub.activePathPrefix &&
                            location.pathname.startsWith(
                              sub.activePathPrefix + "/",
                            )) ||
                          // Sub-sub-items (ignore query string on link targets)
                          sub.subsubItems?.some((ss) =>
                            pathnameMatchesSubSub(location.pathname, ss.path),
                          );

                        return (
                          <div
                            key={sub.name}
                            ref={
                              name === "Report Generation" &&
                              sub.name === "Branches"
                                ? branchesSubmenuRef
                                : undefined
                            }
                          >
                            <div
                              className={`flex items-center justify-between rounded-lg cursor-pointer ${
                                isSubActive
                                  ? "bg-[#EE1E21]"
                                  : "hover:bg-[#EE1E21]"
                              }`}
                              onClick={() =>
                                hasSubsub && toggleSub(name, sub.name)
                              }
                            >
                              <NavLink
                                to={sub.path}
                                onClick={(e) => hasSubsub && e.preventDefault()}
                                className="flex items-center gap-2 sm:gap-3 h-full w-full p-1 sm:p-2 group"
                              >
                                <span
                                  className={
                                    isSubActive
                                      ? "text-[#FADF4B]"
                                      : "text-black group-hover:text-[#FADF4B]"
                                  }
                                >
                                  {sub.icon}
                                </span>
                                <span
                                  className={
                                    isSubActive
                                      ? "text-[#FADF4B]"
                                      : "text-black group-hover:text-[#FADF4B]"
                                  }
                                >
                                  {sub.name}
                                </span>
                              </NavLink>
                              {hasSubsub && (
                                <FaChevronDown
                                  className={`text-xs transition-transform group-hover:text-[#FADF4B] mr-1 sm:mr-2 ${
                                    isSubExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              )}
                            </div>

                            {/* Subsub Items */}
                            {hasSubsub && (
                              <div
                                className={`overflow-hidden transition-all duration-300 ${
                                  isSubExpanded
                                    ? "max-h-[9999px] opacity-100"
                                    : "max-h-0 opacity-0"
                                }`}
                              >
                                <div
                                  className="ml-3 sm:ml-4 mt-1 sm:mt-2 flex max-h-[min(70dvh,calc(100dvh-12rem))] flex-col gap-1 overflow-y-auto overflow-x-hidden overscroll-contain p-0.5 pb-2 pr-1 scroll-pb-2"
                                >
                                  {sub.subsubItems!.map((ss, index) => {
                                    const isSSActive = pathnameMatchesSubSub(
                                      location.pathname,
                                      ss.path,
                                    );
                                    const isLast =
                                      index === sub.subsubItems!.length - 1;
                                    return (
                                      <div
                                        key={`${ss.path}-${ss.name}-${index}`}
                                        className={`w-full shrink-0 rounded-lg cursor-pointer ${
                                          isSSActive
                                            ? "bg-[#EE1E21]"
                                            : "hover:bg-[#EE1E21]"
                                        } ${isLast ? "mb-0.5" : ""}`}
                                      >
                                        <NavLink
                                          to={ss.path}
                                          className="flex items-center gap-2 sm:gap-3 h-full w-full p-1 sm:p-2 group"
                                        >
                                          <span
                                            className={`text-xs sm:text-sm ${
                                              isSSActive
                                                ? "text-[#FADF4B]"
                                                : "text-black group-hover:text-[#FADF4B]"
                                            }`}
                                          >
                                            {ss.name}
                                          </span>
                                        </NavLink>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
