
import { useState, useEffect } from 'react'
import Login from './Login'
import Register from './Register'
import Profile from './Profile'
import Home from './Home'
import Chat from './Chat'
import Navbar from './Navbar'
import './App.css'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleToggle = () => {
    setIsLogin(!isLogin)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setIsAuthenticated(false);
    setIsLogin(true);
  }

  if (!isAuthenticated) {
    return isLogin ? (
      <Login onToggle={handleToggle} onLoginSuccess={handleLoginSuccess} />
    ) : (
      <Register onToggle={handleToggle} onRegisterSuccess={handleRegisterSuccess} />
    )
  }

  // Main app after authentication
  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="app-main">
        {activeTab === 'home' && <Home />}
        {activeTab === 'explore' && <div className="tab-content"><p>Explore coming soon</p></div>}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'profile' && <Profile onLogout={handleLogout} />}
      </div>
    </>
  )
}

export default App
