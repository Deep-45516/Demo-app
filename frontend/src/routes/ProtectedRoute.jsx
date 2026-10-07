import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import "./ProtectedRoute.css";

const API = import.meta.env.VITE_BACKEND_URL;

function MarkIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="9" width="11" height="9" rx="1.5" />
      <path d="M16 11.5h1.5a2 2 0 0 1 0 4H16" />
      <path d="M9 3.5c0 1-1 1-1 2s1 1 1 2" />
      <path d="M12.5 3.5c0 1-1 1-1 2s1 1 1 2" />
    </svg>
  );
}

export default function ProtectedRoute() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [slow, setSlow] = useState(false);

  // Only show the extra line if the check is taking a while
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    function finish(isAuthenticated) {
      if (!mounted) return;
      setAuthenticated(isAuthenticated);
      setCheckingAuth(false);
    }

    async function checkAuthentication() {
      const token = localStorage.getItem("token");

      // No token at all.
      if (!token) {
        finish(false);
        return;
      }

      // Retry while the server wakes up instead of logging the user out.
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const response = await fetch(`${API}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();

            // Keep frontend user data synchronized with the backend.
            if (data.data?.user) {
              localStorage.setItem("user", JSON.stringify(data.data.user));
            }

            finish(true);
            return;
          }

          // Token is genuinely invalid / expired.
          if (response.status >= 400 && response.status < 500) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            finish(false);
            return;
          }

          // 5xx: server is probably waking up, so try again.
        } catch (error) {
          console.error("Authentication check failed:", error);
        }

        if (!mounted) return;
        await new Promise((resolve) => setTimeout(resolve, 2500));
        if (!mounted) return;
      }

      // Server never answered. Keep the saved login and go to the login page.
      finish(false);
    }

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  // Don't render the protected page while we are checking the JWT.
  if (checkingAuth) {
    return (
      <main className="wl-auth-check">
        <div className="wl-auth-check__mark">
          <span className="wl-auth-check__ring" />
          <span className="wl-auth-check__ring wl-auth-check__ring--2" />
          <MarkIcon />
        </div>

        <p
          className={`wl-auth-check__text ${slow ? "is-visible" : ""}`}
          aria-live="polite"
        >
          Waking things up…
        </p>
      </main>
    );
  }

  // No valid JWT → login page.
  if (!authenticated) {
    return <Navigate to="/instagram" replace />;
  }

  // Valid JWT → allow the requested page.
  return <Outlet />;
}