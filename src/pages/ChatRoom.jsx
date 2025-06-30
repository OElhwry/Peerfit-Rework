// src/pages/ChatRoom.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase-config'

export default function ChatRoom() {
  const { chatId } = useParams()
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, snap =>
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [chatId])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send a message
  const handleSend = async e => {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      authorId: currentUser.uid,
      authorUsername: currentUser.username || currentUser.email,
      content,
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'chats', chatId), {
      lastUpdated: serverTimestamp(),
    })
  }

  return (
      <div className="flex-1 flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
          <Link to="/chats" className="text-indigo-600 hover:underline">
            ← Back
          </Link>
          <h2 className="text-xl font-semibold">Chat</h2>
          {/* placeholder for right side */}
          <div className="w-6" />
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map(msg => {
            const isMe = msg.authorId === currentUser.uid
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-xs px-4 py-2 rounded-lg space-y-1
                    ${isMe
                      ? 'bg-indigo-100 text-indigo-900 self-end'
                      : 'bg-white text-gray-800'}
                  `}
                >
                  <div className="text-xs font-medium">
                    {msg.authorUsername}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-2xs text-gray-500 text-right">
                    {msg.createdAt?.toDate().toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center px-6 py-4 bg-white shadow"
        >
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring"
          />
          <button
            type="submit"
            className="ml-4 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
          >
            Send
          </button>
        </form>
      </div>
  )
}
