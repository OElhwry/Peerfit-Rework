// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'         
import Home from './pages/Home'
import Profile from './pages/Profile'
import ViewProfile from './pages/ViewProfile'
import Matches from './pages/Matches'
import Chats from './pages/Chats'
import ChatRoom from './pages/ChatRoom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'

export default function App() {
  const { currentUser } = useAuth()

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={!currentUser ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!currentUser ? <SignUp /> : <Navigate to="/" replace />}
        />

        {/* Protected: all of these share the same sidebar/layout */}
        <Route
          element={
            currentUser
              ? <Layout />
              : <Navigate to="/login" replace />
          }
        >
          <Route path="/"                element={<Home />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/profile/:userId" element={<ViewProfile />} />
          <Route path="/matches"         element={<Matches />} />
          <Route path="/chats"           element={<Chats />} />
          <Route path="/chats/:chatId"   element={<ChatRoom />} />
        </Route>

        {/* Fallback for any unmatched route */}
        <Route
          path="*"
          element={<Navigate to={currentUser ? "/" : "/login"} replace />}
        />
      </Routes>
    </Router>
  )
}
