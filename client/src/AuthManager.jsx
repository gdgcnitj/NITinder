import { useState, useEffect } from "react";
import PageLayout from "./children/modules/layout/PageLayout";

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
      Login ?
      <Login onToggle={handleToggle} onLoginSuccess={handleLoginSuccess} />
      :
      <PageLayout>
        <div style={{color: "white"}}>Build a Login Page Component to handle the login functionality.</div>
      </PageLayout>
    ) : (
      Register ?
      <Register
        onToggle={handleToggle}
          onRegisterSuccess={handleRegisterSuccess}
        />
      :
      <PageLayout>
        <div style={{color: "white"}}>Build a Register Page Component to handle the register functionality.</div>
      </PageLayout>
    );
  }

  return (
    Router ?
    <Router onLogout={handleLogout} />
    :
    <PageLayout>
    <div style={{color: "white"}}>Integrate Router to specify different pages for the apps.</div>
    </PageLayout>
  )
}

export default AuthManager;
