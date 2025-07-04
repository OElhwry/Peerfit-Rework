// src/components/NotificationBell.jsx
import { useEffect, useState } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../contexts/AuthContext'

export default function NotificationBell() {
  const { currentUser } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap =>
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [currentUser])

  const markAllRead = async () => {
    await Promise.all(
      notifs.map(n =>
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      )
    )
    setOpen(false)
  }

  return (
    <div className="relative">
      <BellIcon
        className="w-6 h-6 cursor-pointer text-gray-600"
        onClick={() => setOpen(o => !o)}
      />
      {notifs.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
          {notifs.length}
        </span>
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg overflow-auto max-h-80 z-10">
          <div className="p-2 border-b flex justify-between items-center">
            <span className="font-semibold">Notifications</span>
            <button
              className="text-blue-600 text-sm hover:underline"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          </div>
          {notifs.length ? (
            notifs.map(n => (
              <div key={n.id} className="p-2 hover:bg-gray-100">
                <p className="text-sm">
                  <strong>{n.actorId}</strong> {/* you might look up actorUsername */}
                  {' '}
                  {n.type === 'mention' ? 'mentioned you' :
                   n.type === 'like'    ? 'liked your post' :
                   n.type === 'comment' ? 'commented on your post' :
                   n.type === 'message' ? 'sent you a message' : n.type}
                </p>
                <time className="text-xs text-gray-400">
                  {n.createdAt?.toDate().toLocaleString()}
                </time>
              </div>
            ))
          ) : (
            <p className="p-2 text-gray-500 text-sm">No new notifications</p>
          )}
        </div>
      )}
    </div>
  )
}
