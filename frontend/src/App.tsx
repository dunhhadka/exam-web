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
import { ExamListPage } from './pages/exams/ExamListPage'
import { ExamCreatePage } from './pages/exams/ExamCreatePage'
import { ToastProvider } from './ToastProvider'
import ExamSessionListPage from './pages/examsession/ExamSessionListPage'
import CheckinExam from './pages/take-exams/CheckinExam'
import CheckinValidateToken from './pages/take-exams/CheckinValidateToken'
import CheckInInfo from './pages/take-exams/CheckinInfo'
import TakeExam from './pages/take-exams/TakeExam'
import FinishExam from './pages/take-exams/FinishExam'
import { App as AntdApp } from 'antd'
import DefaultHomePage from './pages/home/DefaultHome'
import CheckExamSystem from './pages/take-exams/CheckExamSystem'
import CheckExamIdentity from './pages/take-exams/CheckExamIdentity'
import PrepareCheckCandidateSystem from './pages/take-exams/PrepareCheckCandidateSystem'
import TakeExamV2 from './pages/take-exams/TakeExamV2'
import ProctorTrackingSystem from './pages/take-exams/ProctorTrackingSystem'
import TakeExamV3 from './pages/take-exams/TakeExamV3'

function App() {
  return (
    <AntdApp>
      <ToastProvider>
        <Provider store={store}>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
                <Route>
                  <Route path="/" element={<DefaultHomePage />} />
                  <Route path="/exam-checkin" element={<CheckinExam />} />
                  <Route
                    path="/exam-checkin-verify-code"
                    element={<CheckinValidateToken />}
                  />
                  <Route path="/exam-checkin-info" element={<CheckInInfo />} />
                  <Route path="/do-exam" element={<TakeExamV3 />} />
                  <Route path="/finish-exam" element={<FinishExam />} />
                  <Route
                    path="/check-exam-system"
                    element={<CheckExamSystem />}
                  />
                  <Route
                    path="/identity-verification"
                    element={<CheckExamIdentity />}
                  />
                  <Route
                    path="/candidate/:roomId/:userId"
                    element={<PrepareCheckCandidateSystem />}
                  />
                </Route>
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/questions" element={<QuestionList />} />
                  <Route path="/exams" element={<ExamListPage />} />
                  <Route
                    path="/examsessions"
                    element={<ExamSessionListPage />}
                  />
                  <Route
                    path="/questions/create"
                    element={<QuestionCreatePage />}
                  />
                  <Route
                    path="/questions/edit/:id"
                    element={<QuestionCreatePage />}
                  />
                  <Route
                    path="/protor-tracking/:roomId/:userId"
                    element={<ProctorTrackingSystem />}
                  />
                  <Route path="/exams/create" element={<ExamCreatePage />} />
                  <Route path="/" element={<Navigate to="/home" replace />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </Provider>
      </ToastProvider>
    </AntdApp>
  )
}

export default App
