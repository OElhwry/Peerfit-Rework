// src/pages/SignUp.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '../../firebase-config'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    // Check username uniqueness
    const usernameQ = query(
      collection(db, 'users'),
      where('username', '==', username)
    )
    const usernameSnap = await getDocs(usernameQ)
    if (!username || usernameSnap.size > 0) {
      setError('That username is taken.')
      return
    }

    try {
      // Create auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const uid = cred.user.uid

      // Write Firestore profile
      await setDoc(doc(db, 'users', uid), {
        username,
        displayName: fullName,
        email,
        location: '',
        sports: [{ sport: '', skillLevel: '', yearsPlaying: 0 }],
        lastUpdated: null,
      })

      // Update FirebaseAuth’s displayName
      await updateProfile(auth.currentUser, {
        displayName: fullName,
      })

      navigate('/')
    } catch (err) {
      console.error(err)
      setError('Failed to create account.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-md rounded-xl p-8 space-y-6"
      >
        <h2 className="text-3xl font-semibold text-center">Sign Up</h2>
        {error && (
          <p className="text-center text-red-600 text-sm">{error}</p>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your real name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                         transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="e.g. fit_guru123"
              value={username}
              onChange={e => setUsername(e.target.value.trim())}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                         transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                         transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                         transition-colors duration-150"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium 
                     rounded-lg transition-colors duration-150"
        >
          Create Account
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 hover:underline">
            Log In
          </a>
        </p>
      </form>
    </div>
  )
}
