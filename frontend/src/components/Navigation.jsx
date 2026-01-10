import { Link, useNavigate, useLocation } from 'react-router-dom'

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          <span className="logo-icon">Q</span>
          <span className="logo-text">Quantum Security Labs</span>
        </Link>

        <div className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/assessment"
            className={`nav-link ${isActive('/assessment') ? 'active' : ''}`}
          >
            New Assessment
          </Link>
        </div>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user.name || 'User'}</span>
            <span className="user-org">{user.organization_name || ''}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-logout-small">
            Logout
          </button>
        </div>

        {/* Mobile menu button */}
        <button className="nav-mobile-toggle" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}

export default Navigation
