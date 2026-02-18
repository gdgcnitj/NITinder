import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import PublicProfile from "./PublicProfile";
import Home from "./Home";
import Chat from "./Chat";
import Navbar from "./Navbar";
import Explore from "./Explore";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleToggle = () => {
    setIsLogin(!isLogin);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    setIsAuthenticated(false);
    setIsLogin(true);
  };

  if (!isAuthenticated) {
    return isLogin ? (
      <Login onToggle={handleToggle} onLoginSuccess={handleLoginSuccess} />
    ) : (
      <Register
        onToggle={handleToggle}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <BrowserRouter>
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Scrollable content */}
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
            <Route
              path="/profile"
              element={<Profile onLogout={handleLogout} />}
            />
            <Route path="/profiles/:id" element={<PublicProfile />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </div>

        {/* Always at bottom */}
        <Navbar />
      </div>
    </BrowserRouter>
  );
}

export default App;
