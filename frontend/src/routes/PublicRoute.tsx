import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'

const PublicRoute = () => {
  const { isAuthenticated } = useSelector((root: RootState) => root.auth)

  const [searchParams] = useSearchParams()

  const isIdenpotencyWindown = searchParams.get('independent') === 'true'

  if (isIdenpotencyWindown) {
    return <Outlet />
  }

  const opener = window.opener

  if (opener) {
    return <Outlet />
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/home" replace />
}

export default PublicRoute
