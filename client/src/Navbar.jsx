import { useNavigate, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const current = location.pathname

  return (
    <nav className="navbar">

      <button
        className={`nav-item ${current === '/home' ? 'active' : ''}`}
        onClick={() => navigate('/home')}
        title="Home"
      >
        {/* Tinder flame icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.92 11.09c-1.05-3.36-3.63-6.01-4.37-6.77-.29-.3-.77-.3-1.06 0-.2.21-2.01 2.16-3.23 4.64C6.13 10.47 6 11.37 6 12.16c0 3.37 2.61 6.11 6 6.11 3.39 0 6-2.74 6-6.11 0-.7-.13-1.39-.32-2.07zM12 19.27c-2.59 0-4.68-2.17-4.68-4.84 0-.59.09-1.15.24-1.67C8.5 9.37 11.47 5.97 12 5.27c.53.7 3.5 4.1 4.44 7.49.15.52.24 1.08.24 1.67 0 2.67-2.09 4.84-4.68 4.84z"/>
        </svg>
      </button>

      <button
        className={`nav-item ${current === '/explore' ? 'active' : ''}`}
        onClick={() => navigate('/explore')}
        title="Explore"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <button
        className={`nav-item ${current === '/chat' ? 'active' : ''}`}
        onClick={() => navigate('/chat')}
        title="Chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <button
        className={`nav-item ${current === '/profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
        title="Profile"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

    </nav>
  )
}

export default Navbar
