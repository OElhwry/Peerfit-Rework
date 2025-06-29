// src/pages/SignUp.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase-config'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setError('Failed to create an account.')
      console.error(err)
    }
  }

return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-card">
        <h2 className="form-title">Sign Up</h2>
        {error && <p className="form-error">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="form-field"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="form-field"
          required
        />
        <button type="submit" className="form-button">
          Sign Up
        </button>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Log In
          </a>
        </p>
      </form>
    </div>
  )
}
