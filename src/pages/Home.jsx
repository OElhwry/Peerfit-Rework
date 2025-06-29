// src/pages/Home.jsx
import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../../firebase-config'
import { signOut } from 'firebase/auth'

export default function Home() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 space-y-4">
      <h1 className="text-3xl font-bold">Welcome to PeerFit!</h1>
      <p className="text-gray-700">
        {currentUser
          ? `Logged in as ${currentUser.email}`
          : 'No user is currently logged in.'}
      </p>

      <Link
        to="/profile"
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        Create / Edit Profile
      </Link>

      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Sign Out
      </button>
    </div>
  )
}