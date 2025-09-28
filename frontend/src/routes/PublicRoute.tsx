import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Navigate, Outlet } from 'react-router-dom'

const PublicRoute = () => {
  const { isAuthenticated } = useSelector((root: RootState) => root.auth)

  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />
}

export default PublicRoute
