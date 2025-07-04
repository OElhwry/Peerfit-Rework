import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { Link } from 'react-router-dom'

export default function Notifications() {
  const { currentUser } = useAuth()
  const [notes, setNotes] = useState([])

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    })
  }, [currentUser])

  const markRead = async id => {
    await updateDoc(doc(db, 'notifications', id), { read: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      {notes.length === 0 ? (
        <p className="text-gray-500">No notifications.</p>
      ) : (
        <ul className="space-y-2 max-w-xl mx-auto">
          {notes.map(n => (
            <li
              key={n.id}
              className={`p-4 rounded-lg ${n.read ? 'bg-white' : 'bg-indigo-50'}`}
            >
              <div className="flex justify-between">
                <p className="text-gray-800">
                  {n.type === 'like'    && <>👍 {n.actorUsername} liked your post</>}
                  {n.type === 'comment' && <>💬 {n.actorUsername} commented</>}
                  {n.type === 'mention' && <>🔔 {n.actorUsername} mentioned you</>}
                  {n.type === 'message' && <>✉️ New message from {n.actorUsername}</>}
                </p>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <time className="text-xs text-gray-400">
                {n.createdAt?.toDate().toLocaleString()}
              </time>
              {/* optionally link to the relevant thing: */}
              {n.postId && (
                <Link to={`/posts/${n.postId}`} className="text-indigo-600 hover:underline text-sm">
                  View Post
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
