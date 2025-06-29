// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Profile from './pages/Profile'

function App() {
  const { currentUser } = useAuth()

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!currentUser ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!currentUser ? <SignUp /> : <Navigate to="/" replace />}
        />

        {/* Protected home route */}
        <Route
          path="/"
          element={currentUser ? <Home /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={currentUser ? <Profile /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  )
}

export default App
