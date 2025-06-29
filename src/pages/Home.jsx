// src/pages/Home.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase-config'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export default function Home() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // 1) Local state for sports
  const [sports, setSports] = useState([])

  // 2) Fetch the user's sports on mount (once we know currentUser.uid)
  useEffect(() => {
    if (!currentUser) return

    async function loadSports() {
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setSports(data.sports || [])
        }
      } catch (err) {
        console.error('Failed loading sports:', err)
      }
    }

    loadSports()
  }, [currentUser])

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

      {/* 3) Sports card */}
      <div className="bg-white p-4 rounded shadow w-full max-w-md">
        <h2 className="font-semibold mb-2">Your Sports</h2>
        {sports.length === 0 ? (
          <p className="text-sm text-gray-500">No sports added yet.</p>
        ) : (
          <ul className="list-disc pl-5 text-gray-700">
            {sports.map((s, i) => (
              <li key={i}>
                {s.sport} — {s.skillLevel}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 4) Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        <Link to="/profile" className="btn-green">
          Edit Profile
        </Link>
        <Link to="/matches" className="btn-indigo">
          Find Matches
        </Link>
        <Link to="/matches" className="btn-blue">
          View All Matches
        </Link>
        <button onClick={handleSignOut} className="btn-red">
          Sign Out
        </button>
      </div>
    </div>
  )
}
