import { Provider } from 'react-redux'
import './App.css'
import { store } from './store'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PublicRoute from './routes/PublicRoute'
import AuthLayout from './components/layouts/AuthLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ProtectedRoute from './routes/ProtectedRoute'
import MainLayout from './components/layouts/MainLayout'
import Home from './pages/home/Home'
import { QuestionList } from './pages/question/QuestionList'
import { QuestionCreatePage } from './pages/question/QuestionCreatePage'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/questions" element={<QuestionList />} />
              <Route
                path="/questions/create"
                element={<QuestionCreatePage />}
              />
              <Route path="/" element={<Navigate to="/home" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
