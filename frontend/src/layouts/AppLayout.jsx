import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../wavelength.css";
import "./AppLayout.css";
import { disconnectSocket } from "../socket";

function SignalMarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <path d="M8.5 14.5a5 5 0 0 1 7 0" />
      <path d="M5.5 11.5a9 9 0 0 1 13 0" />
    </svg>
  );
}

function ConfessIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12l9-9 9 9M5 10v10h14V10" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7l9 6 9-6M4 5h16v14H4z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    navigate("/instagram", { replace: true });
  }

  return (
    <div className="wl-shell">
      <header className="wl-shell__header">
        <div className="wl-shell__brand">
          <SignalMarkIcon />
          <span>Wavelength</span>
        </div>
        <button className="wl-shell__logout" onClick={logout} aria-label="Log out">
          <LogoutIcon />
        </button>
      </header>

      <main className="wl-shell__main">
        <Outlet />
      </main>

      <nav className="wl-shell__nav">
        <NavLink to="/" end className={({ isActive }) => `wl-shell__navlink ${isActive ? "active" : ""}`}>
          <ConfessIcon />
          <span>Confess</span>
        </NavLink>
        <NavLink to="/inbox" className={({ isActive }) => `wl-shell__navlink ${isActive ? "active" : ""}`}>
          <InboxIcon />
          <span>Inbox</span>
        </NavLink>
      </nav>

      {/* Shared static-noise filter — every anonymous avatar across the
          app references #wl-static-filter. Defined once here since this
          shell wraps every page. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="wl-static-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n">
              <animate attributeName="baseFrequency" values="0.9;0.76;0.9" dur="0.6s" repeatCount="indefinite" />
            </feTurbulence>
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.8  0 0 0 0 1  0 0 0 0.9 0" />
          </filter>
          <linearGradient id="wl-avatar-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7C5CFC" />
            <stop offset="1" stopColor="#FF4D8D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}