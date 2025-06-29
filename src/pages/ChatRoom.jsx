// src/pages/ChatRoom.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase-config'

export default function ChatRoom() {
  const { chatId } = useParams()
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [newText, setNewText] = useState('')
  const bottomRef = useRef(null)

  // Listen for new messages in real time
  useEffect(() => {
    if (!chatId) return

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('sentAt', 'asc')
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        setMessages(snapshot.docs.map(doc => doc.data()))
        // scroll to bottom whenever messages update
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      },
      error => {
        console.error('ChatRoom onSnapshot error:', error)
      }
    )

    return () => unsubscribe()
  }, [chatId])

  // Send a new message
  const handleSend = async e => {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        from: currentUser.uid,
        text,
        sentAt: serverTimestamp(),
      })
      setNewText('')
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Messages area */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map((msg, idx) => {
          const isMine = msg.from === currentUser.uid
          return (
            <div
              key={idx}
              className={`max-w-xs break-words p-2 rounded ${
                isMine
                  ? 'bg-blue-200 self-end'
                  : 'bg-white self-start'
              }`}
            >
              {msg.text}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="flex items-center p-4 bg-white border-t"
      >
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring"
        />
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Send
        </button>
      </form>
    </div>
  )
}
