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
import FinishExam from './pages/take-exams/FinishExam'
import { App as AntdApp } from 'antd'
import DefaultHomePage from './pages/home/DefaultHome'
import CheckExamSystem from './pages/take-exams/CheckExamSystem'
import CheckExamIdentity from './pages/take-exams/CheckExamIdentity'
import PrepareCheckCandidateSystem from './pages/take-exams/PrepareCheckCandidateSystem'
import ProctorTrackingSystem from './pages/take-exams/ProctorTrackingSystem'
import TakeExamV2 from './pages/take-exams/TakeExamV2'
import StorePage from './pages/Store/StorePage'
import MyCoursePage from './pages/my-course/MyCoursePage'
import LandingPage from './web-public/LandingPage'
import UserInfo from './pages/auth/UserInfo'
import OverviewPage from './pages/student-page/OverviewPage'
import StudentExamSession from './pages/student-page/StudentExamSession'

function App() {
  return (
    <AntdApp>
      <ToastProvider>
        <Provider store={store}>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home-public" element={<DefaultHomePage />} />
                <Route path="/exam-checkin" element={<CheckinExam />} />
                <Route
                  path="/exam-checkin-verify-code"
                  element={<CheckinValidateToken />}
                />
                <Route path="/exam-checkin-info" element={<CheckInInfo />} />
                <Route path="/do-exam" element={<TakeExamV2 />} />
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

              {/* TEACHER Routes */}
              <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
                <Route element={<MainLayout />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/questions" element={<QuestionList />} />
                  <Route
                    path="/questions/create"
                    element={<QuestionCreatePage />}
                  />
                  <Route
                    path="/questions/edit/:id"
                    element={<QuestionCreatePage />}
                  />
                  <Route path="/exams" element={<ExamListPage />} />
                  <Route path="/exams/create" element={<ExamCreatePage />} />
                  <Route
                    path="/examsessions"
                    element={<ExamSessionListPage />}
                  />
                  <Route
                    path="/protor-tracking/:roomId/:userId"
                    element={<ProctorTrackingSystem />}
                  />
                </Route>
              </Route>

              {/* STUDENT Routes */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route element={<MainLayout />}>
                  <Route path="/overview" element={<OverviewPage />} />
                  <Route
                    path="/student-exam-sessions"
                    element={<StudentExamSession />}
                  />
                </Route>
              </Route>

              {/* Shared Routes (STUDENT và TEACHER) */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER']} />
                }
              >
                <Route element={<MainLayout />}>
                  <Route path="/store" element={<StorePage />} />
                  <Route path="/my-course" element={<MyCoursePage />} />
                  <Route path="/settings" element={<UserInfo />} />
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
