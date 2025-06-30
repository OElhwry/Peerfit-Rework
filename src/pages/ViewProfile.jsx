// src/pages/ViewProfile.jsx
import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../contexts/AuthContext'

export default function ViewProfile() {
  const { userId } = useParams()
  const { currentUser, getOrCreateChat } = useAuth()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [working, setWorking] = useState(false)
  const [posts, setPosts] = useState([])

  // Load user & follow status
  useEffect(() => {
    const loadUser = async () => {
      const snap = await getDoc(doc(db, 'users', userId))
      if (snap.exists()) {
        const data = snap.data()
        setUser(data)
        setIsFollowing((data.followers || []).includes(currentUser.uid))
      }
    }
    loadUser()
  }, [userId, currentUser.uid])

  // Subscribe to their posts
  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap =>
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [userId])

  // Follow / unfollow
  const toggleFollow = async () => {
    setWorking(true)
    const meRef   = doc(db, 'users', currentUser.uid)
    const themRef = doc(db, 'users', userId)
    try {
      if (isFollowing) {
        await updateDoc(meRef,   { following: arrayRemove(userId) })
        await updateDoc(themRef, { followers: arrayRemove(currentUser.uid) })
      } else {
        await updateDoc(meRef,   { following: arrayUnion(userId) })
        await updateDoc(themRef, { followers: arrayUnion(currentUser.uid) })
      }
      setIsFollowing(!isFollowing)
    } catch (e) {
      console.error(e)
    }
    setWorking(false)
  }

  // Start or open chat
  const handleMessage = async () => {
    const chatId = await getOrCreateChat(currentUser.uid, userId)
    navigate(`/chats/${chatId}`)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{user.displayName}</h1>
              <p className="text-indigo-600">@{user.username}</p>
            </div>
            {currentUser.uid !== userId && (
              <div className="flex space-x-3">
                <button
                  onClick={toggleFollow}
                  disabled={working}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition
                    ${isFollowing
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  onClick={handleMessage}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  Message
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 flex space-x-8 text-gray-700">
            <div>
              <span className="font-semibold">{user.followers?.length || 0}</span>
              <p className="text-sm">Followers</p>
            </div>
            <div>
              <span className="font-semibold">{user.following?.length || 0}</span>
              <p className="text-sm">Following</p>
            </div>
            <div>
              <span className="font-semibold">{posts.length}</span>
              <p className="text-sm">Posts</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Posts</h2>
          {posts.length ? (
            posts.map(p => (
              <div key={p.id} className="bg-white shadow rounded-lg p-4">
                <time
                  dateTime={p.createdAt?.toDate().toISOString()}
                  className="block text-xs text-gray-500 mb-1"
                >
                  {p.createdAt?.toDate().toLocaleString()}
                </time>
                <p className="text-gray-800">{p.content}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              This user hasn’t posted yet.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
