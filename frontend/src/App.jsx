//App.jsx
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

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
    const [backendReady, setBackendReady] = useState(false);
  const [healthcheckStartedAt] = useState(() => performance.now());
  useEffect(() => {
  // ONE backend request.
  // This request both wakes Render and tells us
  // whether the backend is responding quickly or slowly.
  fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/healthcheck`, {
    cache: "no-store",
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Healthcheck failed");
      }

      setBackendReady(true);
    })
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
  element={
    <InstagramVerification
      backendReady={backendReady}
      healthcheckStartedAt={healthcheckStartedAt}
    />
  }
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