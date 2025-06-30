// src/pages/Chats.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../../firebase-config'

export default function Chats() {
  const { currentUser, getOrCreateChat } = useAuth()
  const [chats, setChats] = useState([])
  const [following, setFollowing] = useState([])
  const [usernames, setUsernames] = useState({})
  const navigate = useNavigate()

  // 1) Subscribe to your existing chats
  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastUpdated', 'desc')
    )
    return onSnapshot(q, snap =>
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [currentUser])

  // 2) Load your follow list
  useEffect(() => {
    if (!currentUser) return
    getDoc(doc(db, 'users', currentUser.uid)).then(u => {
      setFollowing(u.data()?.following || [])
    })
  }, [currentUser])

  // 3) Fetch other users' usernames
  useEffect(() => {
    const ids = new Set()

    // from existing chats
    chats.forEach(c => {
      const other = c.participants.find(id => id !== currentUser.uid)
      if (other) ids.add(other)
    })

    // from followees not yet chatted with
    following.forEach(id => {
      const inChat = chats.some(c => c.participants.includes(id))
      if (!inChat) ids.add(id)
    })

    ids.forEach(id => {
      if (!usernames[id]) {
        getDoc(doc(db, 'users', id)).then(snap => {
          const data = snap.data() || {}
          setUsernames(prev => ({
            ...prev,
            [id]: data.username || data.displayName || id,
          }))
        })
      }
    })
  }, [chats, following, currentUser.uid, usernames])

  // Start or resume chat
  const startChat = async otherUid => {
    const chatId = await getOrCreateChat(currentUser.uid, otherUid)
    navigate(`/chats/${chatId}`)
  }

  // Who you've already chatted with
  const chattedWith = new Set(
    chats.flatMap(c => c.participants.filter(id => id !== currentUser.uid))
  )
  const notYet = following.filter(id => !chattedWith.has(id))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-center">Your Chats</h1>

        {/* Existing Chats */}
        {chats.length > 0 ? (
          <div className="space-y-4">
            {chats.map(c => {
              const other = c.participants.find(id => id !== currentUser.uid)
              return (
                <Link
                  key={c.id}
                  to={`/chats/${c.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition"
                >
                  <span className="font-medium">
                    {usernames[other] || other}
                  </span>
                  <span className="text-sm text-gray-500">View →</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            You have no active chats.
          </p>
        )}

        {/* New Chats With Followees */}
        {notYet.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Start a new chat</h2>
            {notYet.map(id => (
              <button
                key={id}
                onClick={() => startChat(id)}
                className="w-full text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition flex items-center justify-between"
              >
                <span>{usernames[id] || id}</span>
                <span className="text-sm text-indigo-600">Message →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
