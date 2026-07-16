import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import InstagramVerification from "./pages/InstagramVerification";
import AnonymousIdentity from "./pages/AnonymousIdentity.jsx";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/admin" element={<Admin />} />
      <Route path="/instagram" element={<InstagramVerification />} />
      <Route path="/anonymous" element={<AnonymousIdentity />} />
    </Routes>
  );
}

export default App;
