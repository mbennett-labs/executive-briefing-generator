import { Navigate, useLocation } from 'react-router-dom'
import Navigation from './Navigation'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('token')

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="app-layout">
      <Navigation />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default ProtectedRoute
