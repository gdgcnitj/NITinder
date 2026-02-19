import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./Home";
import Chat from "./Chat";
import Explore from "./Explore";
import Profile from "./Profile";
import PublicProfile from "./children/PublicProfile";
import Navbar from "./Navbar";

/**
 * AppRouter - Contains all route definitions for the authenticated app.
 * Renders the main layout with Navbar and scrollable content area.
 *
 * @param {Object} props
 * @param {Function} props.onLogout - Callback when user logs out
 */
function AppRouter({ onLogout }) {
  return (
    <BrowserRouter>
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile onLogout={onLogout} />} />
            <Route path="/profiles/:id" element={<PublicProfile />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </div>

        {/* // INSERT NAVBAR HERE */}
        <Navbar />
      </div>
    </BrowserRouter>
  );
}

export default AppRouter;
