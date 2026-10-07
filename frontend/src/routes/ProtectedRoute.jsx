import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ProtectedRoute() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuthentication() {
      const token = localStorage.getItem("token");

      // No token at all.
      if (!token) {
        if (mounted) {
          setAuthenticated(false);
          setCheckingAuth(false);
        }

        return;
      }

      try {
        const response = await fetch(
          `${API}/api/v1/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Token is invalid / expired.
        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          if (mounted) {
            setAuthenticated(false);
            setCheckingAuth(false);
          }

          return;
        }

        const data = await response.json();

        // Keep frontend user data synchronized
        // with the backend.
        if (data.data?.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(data.data.user)
          );
        }

        if (mounted) {
          setAuthenticated(true);
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error
        );

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (mounted) {
          setAuthenticated(false);
          setCheckingAuth(false);
        }
      }
    }

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  // Don't render the protected page
  // while we are checking the JWT.
  if (checkingAuth) {
    return <p>Checking authentication...</p>;
  }

  // No valid JWT → login page.
  if (!authenticated) {
    return <Navigate to="/instagram" replace />;
  }

  // Valid JWT → allow the requested page.
  return <Outlet />;
}