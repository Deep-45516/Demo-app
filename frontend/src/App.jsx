import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import {
  connectSocket,
  disconnectSocket,
} from "./socket";

import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import InstagramVerification from "./components/InstagramVerification/InstagramVerification.jsx";
import Inbox from "./pages/Inbox.jsx";
import ConfessionDetails from "./pages/ConfessionDetails.jsx";
import Chat from "./pages/Chat.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AppLayout from "./layouts/AppLayout.jsx";

function App() {
  useEffect(() => {
    // Wake Render backend as soon as the frontend loads.
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/healthcheck`)
      .catch(() => {});

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <Routes>

      {/* =========================
          PUBLIC ROUTES
          ========================= */}

      <Route
        path="/instagram"
        element={<InstagramVerification />}
      />

      <Route
        path="/admin"
        element={<Admin />}
      />


      {/* =========================
          PROTECTED APP
          ========================= */}

      <Route element={<ProtectedRoute />}>

        <Route element={<AppLayout />}>

          {/* Home / Confess */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* Inbox */}
          <Route
            path="/inbox"
            element={<Inbox />}
          />

          {/* Individual confession */}
          <Route
            path="/confessions/:id"
            element={<ConfessionDetails />}
          />

          {/* Anonymous conversation */}
          <Route
            path="/chat/:conversationId"
            element={<Chat />}
          />

        </Route>

      </Route>

    </Routes>
  );
}

export default App;