//C:\Users\yashl\OneDrive\Desktop\clean-repo\frontend\src\layouts\AppLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../wavelength.css"
import { disconnectSocket } from "../socket";

export default function AppLayout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

     disconnectSocket();

    navigate("/instagram", { replace: true });
  }

  return (
    <div>
      {/* =========================
          MAIN APP CONTENT
          ========================= */}

      <main>
        <Outlet />
      </main>

      {/* =========================
          APP NAVIGATION
          ========================= */}

      <nav>
        <NavLink to="/">
          Confess
        </NavLink>

        {" | "}

        <NavLink to="/inbox">
          Inbox
        </NavLink>

        {" | "}

        <button onClick={logout}>
          Logout
        </button>
      </nav>
    </div>
  );
}