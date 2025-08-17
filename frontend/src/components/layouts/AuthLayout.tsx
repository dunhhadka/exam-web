import { Outlet } from 'react-router-dom'
import HeaderAuth from '../common/HeaderAuth'
import FormAuth from '../common/FormAuth'

const AuthLayout = () => {
  return (
    <div>
      <HeaderAuth />
      <main>
        <FormAuth>
          <Outlet />
        </FormAuth>
      </main>
    </div>
  )
}

export default AuthLayout
