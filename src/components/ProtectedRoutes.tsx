import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoutes() {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const hasSession = Boolean(accessToken || refreshToken);
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (hasSession && location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    } else if (!hasSession) {
      navigate("/", { replace: true });
    }
    setMounted(true);
  }, [navigate, hasSession, location.pathname]);

  if (!mounted) return null;

  return <Outlet />;
}
