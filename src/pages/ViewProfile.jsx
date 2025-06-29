// src/pages/ViewProfile.jsx
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'

export default function ViewProfile() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'users', userId))
        setProfile(snap.exists() ? snap.data() : null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  if (loading) return <p className="p-4">Loading…</p>
  if (!profile) return <p className="p-4">Profile not found.</p>

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">
        {profile.displayName || profile.email}
      </h1>
      <p className="mb-4">Location: {profile.location}</p>
      <div className="bg-white p-4 rounded shadow w-full max-w-md">
        <h2 className="font-semibold mb-2">Sports</h2>
        <ul className="list-disc pl-5">
          {profile.sports.map((s, i) => (
            <li key={i}>
              {s.sport} — {s.skillLevel}
            </li>
          ))}
        </ul>
      </div>
      <Link
        to="/matches"
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Back to Matches
      </Link>
    </div>
  )
}
