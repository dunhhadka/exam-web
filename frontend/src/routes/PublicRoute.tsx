import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Navigate, Outlet } from 'react-router-dom'

const PublicRoute = () => {
  const { token } = useSelector((root: RootState) => root.auth)

  return !token ? <Outlet /> : <Navigate to="/" replace />
}

export default PublicRoute
