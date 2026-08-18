import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/instagram"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}