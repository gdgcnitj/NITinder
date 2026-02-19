import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./children/Home";
import Chat from "./children/Chat";
import Explore from "./children/Explore";
import Profile from "./children/Profile";
import PublicProfile from "./children/PublicProfile";
import Navbar from "./children/Navbar";

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

        <Navbar />
      </div>
    </BrowserRouter>
  );
}

export default AppRouter;
