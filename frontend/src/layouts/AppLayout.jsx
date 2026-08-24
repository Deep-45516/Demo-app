//C:\Users\yashl\OneDrive\Desktop\clean-repo\frontend\src\layouts\AppLayout.jsx
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useRef } from "react";

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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12l9-9 9 9M5 10v10h14V10" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7l9 6 9-6M4 5h16v14H4z" />
    </svg>
  );
}

// function LogoutIcon() {
//   return (
//     <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//       <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
//       <path d="M16 17l5-5-5-5" />
//       <path d="M21 12H9" />
//     </svg>
//   );
// }

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;

    const touch = e.touches[0];

    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    /*
     * Only treat it as a swipe when the horizontal
     * movement is stronger than the vertical movement.
     */
    if (Math.abs(diffX) > Math.abs(diffY)) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping.current || touchStartX.current === null) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const touch = e.changedTouches[0];

    const diffX = touch.clientX - touchStartX.current;

    const SWIPE_THRESHOLD = 70;

    /*
     * Currently:
     *
     * /       = Confess
     * /inbox   = Inbox
     *
     * Swipe LEFT  -> Inbox
     * Swipe RIGHT -> Confess
     */

    if (Math.abs(diffX) >= SWIPE_THRESHOLD) {
      if (diffX < 0 && location.pathname !== "/inbox") {
        navigate("/inbox");
      }

      if (diffX > 0 && location.pathname === "/inbox") {
        navigate("/");
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  };

  // function logout() {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("user");
  //   disconnectSocket();
  //   navigate("/instagram", { replace: true });
  // }

  return (
    <div className="wl-shell">
      {/* <header className="wl-shell__header">
      

      </header> */}

             {/* {location.pathname === "/" && (
  <button
    className="wl-shell__logout"
    onClick={logout}
    aria-label="Log out"
  >
    <LogoutIcon />
  </button>
)} */}

      

      <main
  className="wl-shell__main"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  <div
    key={location.pathname}
    className={`wl-page-transition ${
      location.pathname === "/inbox"
        ? "wl-page-transition--inbox"
        : "wl-page-transition--confess"
    }`}
  >
    <Outlet />
  </div>
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