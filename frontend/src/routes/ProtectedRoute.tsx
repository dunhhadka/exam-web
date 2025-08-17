import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  const { token } = useSelector((state: RootState) => state.auth)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
