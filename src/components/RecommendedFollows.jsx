// src/components/RecommendedFollows.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '../../firebase-config'

export default function RecommendedFollows() {
  const { currentUser } = useAuth()
  const [recs, setRecs] = useState(null) // null = loading, [] = loaded but none

  useEffect(() => {
    async function loadRecs() {
      // 1) load your sports & following list
      const youSnap = await getDoc(doc(db, 'users', currentUser.uid))
      const youData = youSnap.data() || {}
      const yourSports = Array.isArray(youData.sports) ? youData.sports : []
      const followingSet = new Set(youData.following || [])

      // 2) fetch everybody else
      const allSnap = await getDocs(collection(db, 'users'))
      const others = allSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== currentUser.uid && !followingSet.has(u.id))

      // 3) score & gather common sports
      const scored = others
        .map(u => {
          const uSports = Array.isArray(u.sports) ? u.sports : []
          const commonSports = yourSports
            .map(ms => ms.sport)
            .filter(sport =>
              uSports.some(us => us.sport === sport)
            )
          return {
            ...u,
            commonSports,
          }
        })
        .filter(u => u.commonSports.length > 0)       // only those with at least one in common
        .sort((a, b) => b.commonSports.length - a.commonSports.length)
        .slice(0, 5)                                  // top 5

      setRecs(scored)
    }
    loadRecs()
  }, [currentUser])

  const handleFollow = async otherId => {
    const meRef = doc(db, 'users', currentUser.uid)
    const themRef = doc(db, 'users', otherId)
    await updateDoc(meRef,   { following: arrayUnion(otherId) })
    await updateDoc(themRef, { followers: arrayUnion(currentUser.uid) })
    // remove from recs list immediately
    setRecs(r => r.filter(u => u.id !== otherId))
  }

  if (recs === null) {
    return (
      <section className="max-w-2xl mx-auto p-4">
        <p className="text-center text-gray-500">Loading suggestions…</p>
      </section>
    )
  }

  if (recs.length === 0) {
    return (
      <section className="max-w-2xl mx-auto p-4">
        <p className="text-center text-gray-500">
          No new people to recommend right now.
        </p>
      </section>
    )
  }

  return (
    <section className="bg-white p-4 rounded-lg shadow max-w-2xl mx-auto space-y-3">
      <h2 className="text-xl font-semibold text-gray-800">
        Recommended to Follow
      </h2>
      {recs.map(u => (
        <div
          key={u.id}
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
        >
          <div>
            <Link
              to={`/profile/${u.id}`}
              className="font-medium text-indigo-600 hover:underline"
            >
              @{u.username || u.displayName}
            </Link>
            <p className="text-sm text-gray-500">
              Common sports: {u.commonSports.join(', ')}
            </p>
          </div>
          <button
            onClick={() => handleFollow(u.id)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Follow
          </button>
        </div>
      ))}
    </section>
  )
}
