// src/pages/Matches.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../../firebase-config'

export default function Matches() {
  const { currentUser, getOrCreateChat } = useAuth()
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [usernames, setUsernames] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) return

    async function loadMatches() {
      try {
        // 1) load your profile sports
        const youSnap = await getDoc(doc(db, 'users', currentUser.uid))
        const youData = youSnap.data() || {}
        const youSports = Array.isArray(youData.sports) ? youData.sports : []

        if (youSports.length === 0) {
          setMatches([])
          return
        }

        // 2) load all other users
        const allSnap = await getDocs(collection(db, 'users'))
        const others = allSnap.docs
          .filter(d => d.id !== currentUser.uid)
          .map(d => {
            const u = d.data() || {}
            return {
              id: d.id,
              displayName: u.displayName,
              username: u.username,
              sports: Array.isArray(u.sports) ? u.sports : [],
            }
          })

        // 3) compute matching score
        const scored = others
          .map(u => {
            const score = youSports.reduce((sum, my) => {
              return (
                sum +
                (u.sports.some(
                  s =>
                    s.sport === my.sport &&
                    s.skillLevel === my.skillLevel
                )
                  ? 1
                  : 0)
              )
            }, 0)
            return { ...u, score }
          })
          .filter(u => u.score > 0)
          .sort((a, b) => b.score - a.score)

        setMatches(scored)

        // 4) fetch usernames for matches
        const nameMap = {}
        await Promise.all(
          scored.map(async u => {
            const snap = await getDoc(doc(db, 'users', u.id))
            const data = snap.data() || {}
            nameMap[u.id] =
              data.username || data.displayName || 'Unknown'
          })
        )
        setUsernames(nameMap)
      } catch (err) {
        console.error('Error loading matches:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [currentUser])

  const startChat = async otherId => {
    const chatId = await getOrCreateChat(currentUser.uid, otherId)
    navigate(`/chats/${chatId}`)
  }

  if (loading) {
    return (
        <div className="py-20 text-center text-gray-500">
          Loading your matches…
        </div>
    )
  }

  return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">
          Your Matches
        </h1>

        {matches.length === 0 ? (
          <p className="text-center text-gray-500">
            No matches found. Try updating your profile.
          </p>
        ) : (
          <div className="space-y-4">
            {matches.map(user => (
              <div
                key={user.id}
                className="bg-white shadow rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-lg font-medium text-gray-800">
                    {usernames[user.id]}
                  </p>
                  <p className="text-sm text-gray-600">
                    Shared sports: {user.score}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/profile/${user.id}`}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => startChat(user.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
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
