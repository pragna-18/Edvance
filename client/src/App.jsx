import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LessonGenerator from './pages/LessonGenerator';
import LessonPlans from './pages/LessonPlans';
import LessonPlanDetail from './pages/LessonPlanDetail';
import Templates from './pages/Templates';
import Collaboration from './pages/Collaboration';
import Approvals from './pages/Approvals';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <Navbar />
              <AIAssistant />
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/generate"
                element={
                  <PrivateRoute allowedRoles={['teacher', 'HOD']}>
                    <LessonGenerator />
                  </PrivateRoute>
                }
              />
              <Route
                path="/plans"
                element={
                  <PrivateRoute>
                    <LessonPlans />
                  </PrivateRoute>
                }
              />
              <Route
                path="/plans/:id"
                element={
                  <PrivateRoute>
                    <LessonPlanDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <PrivateRoute>
                    <Templates />
                  </PrivateRoute>
                }
              />
              <Route
                path="/collaborate/:id"
                element={
                  <PrivateRoute>
                    <Collaboration />
                  </PrivateRoute>
                }
              />
              <Route
                path="/approvals"
                element={
                  <PrivateRoute allowedRoles={['HOD']}>
                    <Approvals />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;




