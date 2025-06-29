// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase-config'    // ← both from root

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // helper lives inside the provider
  async function getOrCreateChat(uid1, uid2) {
    const [a, b] = [uid1, uid2].sort()
    const chatId = `${a}_${b}`
    const ref = doc(db, 'chats', chatId)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        participants: [a, b],
        lastUpdated: serverTimestamp(),
      })
    }
    return chatId
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // expose both currentUser and our helper
  const value = { currentUser, getOrCreateChat }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
