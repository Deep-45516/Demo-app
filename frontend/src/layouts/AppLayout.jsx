import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
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

// Order of the swipeable tabs. Only these two routes get the
// swipe gesture and slide animation — everything else (chat,
// confession detail) is a "drill in" screen reached by tapping,
// not swiping, so it stays out of this list on purpose.
const TAB_ORDER = ["/", "/inbox"];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [slideDir, setSlideDir] = useState("left");
  const prevPathRef = useRef(location.pathname);
  const prevIndexRef = useRef(TAB_ORDER.indexOf(location.pathname));

  useEffect(() => {
    if (location.pathname === prevPathRef.current) return;

    const newIndex = TAB_ORDER.indexOf(location.pathname);
    const oldIndex = prevIndexRef.current;

    if (newIndex !== -1 && oldIndex !== -1) {
      setSlideDir(newIndex > oldIndex ? "left" : "right");
    }

    prevPathRef.current = location.pathname;
    prevIndexRef.current = newIndex;
  }, [location.pathname]);

  // Swipe-to-switch between Confess and Inbox. Ignored if the
  // touch starts on an input/textarea (so it never fights text
  // selection or cursor placement while someone is typing).
  const touchRef = useRef({ x: 0, y: 0, active: false });

  function handleTouchStart(e) {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    const currentIndex = TAB_ORDER.indexOf(location.pathname);
    if (currentIndex === -1) return; // not on a swipeable tab

    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, active: true };
  }

  function handleTouchEnd(e) {
    if (!touchRef.current.active) return;
    touchRef.current.active = false;

    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    const currentIndex = TAB_ORDER.indexOf(location.pathname);
    if (dx < 0 && currentIndex < TAB_ORDER.length - 1) {
      navigate(TAB_ORDER[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      navigate(TAB_ORDER[currentIndex - 1]);
    }
  }

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

      <main className="wl-shell__main" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div key={location.pathname} className={`wl-page-slide wl-slide-${slideDir}`}>
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
            <stop offset="0" stopColor="#F0B85C" />
            <stop offset="1" stopColor="#C97355" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}