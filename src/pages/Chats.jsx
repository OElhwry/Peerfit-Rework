// src/pages/Chats.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../contexts/AuthContext'

export default function Chats() {
  const { currentUser } = useAuth()
  const [chats, setChats] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!currentUser) return

    console.log(`🔍 Setting up listener for chats containing ${currentUser.uid}`)

    // 1) Try the real‐time listener first
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastUpdated', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      async snapshot => {
        console.log('📬 onSnapshot docs:', snapshot.docs.map(d => d.id))

        if (snapshot.docs.length === 0) {
          // Fallback: one‐time getDocs to see if query itself returns anything
          console.log('📥 No docs in onSnapshot—running getDocs fallback…')
          try {
            const fallbackSnap = await getDocs(
              query(
                collection(db, 'chats'),
                where('participants', 'array-contains', currentUser.uid)
                // note: omit orderBy here if it’s an indexing issue
              )
            )
            console.log('📥 getDocs returned:', fallbackSnap.docs.map(d => d.id))
            if (fallbackSnap.docs.length === 0) {
              console.warn('⚠️ No chat documents at all for this user.')
              setChats([])
              return
            } else {
              // proceed to enrich fallbackSnap.docs
              await enrichAndSet(fallbackSnap.docs)
              return
            }
          } catch (e) {
            console.error('❌ getDocs fallback error:', e)
            setError(e.message)
            return
          }
        }

        // If we got here, onSnapshot has docs—enrich them
        await enrichAndSet(snapshot.docs)
      },
      err => {
        console.error('❌ onSnapshot error:', err)
        setError(err.message)
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  // Helper to enrich a list of docSnaps into name‐labeled chats
  async function enrichAndSet(docSnaps) {
    const enriched = await Promise.all(
      docSnaps.map(async docSnap => {
        const data = docSnap.data()
        const otherUids = data.participants.filter(uid => uid !== currentUser.uid)

        const otherNames = await Promise.all(
          otherUids.map(async uid => {
            try {
              const userSnap = await getDoc(doc(db, 'users', uid))
              if (userSnap.exists()) {
                const u = userSnap.data()
                return u.displayName || u.email
              }
            } catch (e) {
              console.warn(`⚠️ Could not load user ${uid}:`, e)
            }
            return uid
          })
        )

        return {
          id: docSnap.id,
          otherNames,
          lastUpdated: data.lastUpdated?.toDate?.().toLocaleString(),
        }
      })
    )

    console.log('✅ Final enriched chats:', enriched)
    setChats(enriched)
  }

  if (!currentUser) return null

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Your Chats</h1>

      {error && (
        <p className="text-red-600">Error loading chats: {error}</p>
      )}

      {!error && chats.length === 0 && (
        <p className="text-gray-500">You have no chats yet.</p>
      )}

      {chats.map(c => (
        <Link
          key={c.id}
          to={`/chats/${c.id}`}
          className="block p-3 bg-white rounded shadow hover:bg-gray-100"
        >
          Chat with {c.otherNames.join(', ')}
          <span className="block text-xs text-gray-400">
            Last updated: {c.lastUpdated}
          </span>
        </Link>
      ))}
    </div>
  )
}
