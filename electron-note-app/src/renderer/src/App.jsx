import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './components/sign-in/SignIn'
import SignUp from './components/sign-up/SignUp'
import Dashboard from './components/Dashboard'
import AppLayout from './components/AppLayout'
import AppTheme from './components/shared-theme/AppTheme'

function App() {
  return (
    <AppTheme>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applayout" element={<AppLayout />} />
        </Routes>
      </Router>
    </AppTheme>
  )
}

export default App
