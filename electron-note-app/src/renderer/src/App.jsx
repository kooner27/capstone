import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import SignIn from './components/sign-in/SignIn'
import SignUp from './components/sign-up/SignUp'
import Dashboard from './components/Dashboard'
import AppLayout from './components/AppLayout'
import AppTheme from './components/shared-theme/AppTheme'
import { isAuthenticated } from './api/auth'

// Simple Protected Route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }
  return children;
};

function App() {
  return (
    <AppTheme>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated()
                ? <Navigate to="/applayout" />
                : <Navigate to="/signin" />
            }
          />
          <Route
            path="/signin"
            element={
              isAuthenticated()
                ? <Navigate to="/applayout" />
                : <SignIn />
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated()
                ? <Navigate to="/applayout" />
                : <SignUp />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applayout"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AppTheme>
  )
}

export default App
