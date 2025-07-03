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
    async function loadUser() {
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
    const meRef = doc(db, 'users', currentUser.uid)
    const themRef = doc(db, 'users', userId)
    try {
      if (isFollowing) {
        await updateDoc(meRef, { following: arrayRemove(userId) })
        await updateDoc(themRef, { followers: arrayRemove(currentUser.uid) })
      } else {
        await updateDoc(meRef, { following: arrayUnion(userId) })
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
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={`${user.displayName}’s avatar`}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {user.displayName}
                </h1>
                <p className="text-indigo-600">@{user.username}</p>
              </div>
            </div>

            {/* Follow / Message */}
            {currentUser.uid !== userId && (
              <div className="flex space-x-3">
                <button
                  onClick={toggleFollow}
                  disabled={working}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                    isFollowing
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
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
          <div className="flex justify-around text-center text-gray-700">
            <div>
              <span className="block text-xl font-semibold">
                {user.followers?.length || 0}
              </span>
              <span className="text-sm">Followers</span>
            </div>
            <div>
              <span className="block text-xl font-semibold">
                {user.following?.length || 0}
              </span>
              <span className="text-sm">Following</span>
            </div>
            <div>
              <span className="block text-xl font-semibold">{posts.length}</span>
              <span className="text-sm">Posts</span>
            </div>
          </div>

          {/* Bio & Interests */}
          {user.bio && <p className="text-gray-700">{user.bio}</p>}
          {user.interests && (
            <p className="text-sm text-gray-500">
              <span className="font-medium">Interests:</span> {user.interests}
            </p>
          )}
        </div>

        {/* Posts */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Posts</h2>
          {posts.length ? (
            posts.map(p => (
              <div
                key={p.id}
                className="bg-white shadow rounded-lg p-4 hover:shadow-md transition"
              >
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
