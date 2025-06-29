// src/pages/Matches.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../contexts/AuthContext'

export default function Matches() {
  const { currentUser, getOrCreateChat } = useAuth()
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const navigate = useNavigate()

  // Fetch and score matches
  useEffect(() => {
    if (!currentUser) return

    async function loadMatches() {
      try {
        // 1) Get current user's sports
        const youSnap = await getDoc(doc(db, 'users', currentUser.uid))
        const you = youSnap.exists() ? youSnap.data() : { sports: [] }

        if (!you.sports.length) {
          setMatches([])
          return
        }

        // 2) Get all other users
        const allUsersSnap = await getDocs(collection(db, 'users'))
        const others = allUsersSnap.docs
          .filter(d => d.id !== currentUser.uid)
          .map(d => ({ id: d.id, ...d.data() }))

        // 3) Compute match score
        const scored = others.map(user => {
          const common = you.sports.reduce((cnt, mine) => {
            return cnt + (user.sports.find(
              u => u.sport === mine.sport && u.skillLevel === mine.skillLevel
            ) ? 1 : 0)
          }, 0)
          return { ...user, score: common }
        })

        // 4) Filter & sort
        const filtered = scored
          .filter(u => u.score > 0)
          .sort((a, b) => b.score - a.score)

        setMatches(filtered)
      } catch (err) {
        console.error('Error loading matches:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [currentUser])

  // Create or navigate to a chat with another user
  const handleMessage = async otherUid => {
    const chatId = await getOrCreateChat(currentUser.uid, otherUid)
    navigate(`/chats/${chatId}`)
  }

  if (loading) return <p className="p-4">Loading matches…</p>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Your Matches</h1>

      {!matches.length ? (
        <p className="text-center text-gray-500">
          No matches found. Try updating your profile.
        </p>
      ) : (
        <div className="space-y-4 max-w-lg mx-auto">
          {matches.map(user => (
            <div
              key={user.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {user.displayName || user.email}
                </p>
                <p className="text-sm text-gray-600">
                  Shared sports: {user.score}
                </p>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/profile/${user.id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Profile
                </Link>

                <button
                  onClick={() => handleMessage(user.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
