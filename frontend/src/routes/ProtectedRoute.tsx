import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
