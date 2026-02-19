import { useState, useEffect } from "react";

/**
 * AuthManager - Orchestrates authentication flow and app access.
 * Shows Login or Register when unauthenticated; renders the Router when authenticated.
 *
 * @param {Object} props
 * @param {React.Component} props.Login - Login page component
 * @param {React.Component} props.Register - Register page component
 * @param {React.Component} props.Router - Router component (contains all app routes)
 */
function AuthManager({ Login, Register, Router }) {
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

  return <Router onLogout={handleLogout} />;
}

export default AuthManager;
