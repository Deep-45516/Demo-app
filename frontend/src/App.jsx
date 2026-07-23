import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import InstagramVerification from "./components/InstagramVerification/InstagramVerification.jsx";
import Inbox from "./pages/Inbox.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/admin" element={<Admin />} />
      <Route path="/instagram" element={<InstagramVerification />} />
      <Route
    path="/inbox"
    element={<Inbox />}
/>
    </Routes>
  );
}

export default App;import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import InstagramVerification from "./components/InstagramVerification/InstagramVerification.jsx";
import Inbox from "./pages/Inbox.jsx";
import ConfessionDetails from "./pages/ConfessionDetails.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/admin" element={<Admin />} />

      <Route
        path="/instagram"
        element={<InstagramVerification />}
      />

      <Route
        path="/inbox"
        element={<Inbox />}
      />

      <Route
        path="/confessions/:id"
        element={<ConfessionDetails />}
      />
    </Routes>
  );
}

export default App;
