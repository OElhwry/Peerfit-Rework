// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useNavigate } from 'react-router-dom'

const SPORT_OPTIONS = [
  'Soccer',
  'Basketball',
  'Tennis',
  'Volleyball',
  'Running',
  // …add as many as you like
]
const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']

export default function Profile() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    displayName: '',
    location: '',
    sports: [ { sport: '', skillLevel: '' } ]  // start with one row
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load existing
  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'users', currentUser.uid))
      if (snap.exists()) {
        setForm(snap.data())
      }
      setLoading(false)
    }
    load()
  }, [currentUser.uid])

  const handleChange = (idx, field, value) => {
    setForm(f => {
      const arr = [...f.sports]
      arr[idx] = { ...arr[idx], [field]: value }
      return { ...f, sports: arr }
    })
  }

  const addSport = () => {
    setForm(f => ({ ...f, sports: [ ...f.sports, { sport: '', skillLevel: '' } ] }))
  }
  const removeSport = idx => {
    setForm(f => ({
      ...f,
      sports: f.sports.filter((_, i) => i !== idx)
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    await setDoc(doc(db, 'users', currentUser.uid), form, { merge: true })
    setSaving(false)
    navigate('/')
  }

  if (loading) return <p className="p-4">Loading…</p>

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-card space-y-4">
        <h2 className="form-title">Your Profile</h2>
        <input
          placeholder="Name"
          value={form.displayName}
          onChange={e =>
            setForm(f => ({ ...f, displayName: e.target.value }))
          }
          className="form-field"
          required
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={e =>
            setForm(f => ({ ...f, location: e.target.value }))
          }
          className="form-field"
          required
        />

        {form.sports.map((entry, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <select
              value={entry.sport}
              onChange={e => handleChange(idx, 'sport', e.target.value)}
              className="form-field flex-1"
              required
            >
              <option value="" disabled>
                Pick a sport
              </option>
              {SPORT_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={entry.skillLevel}
              onChange={e =>
                handleChange(idx, 'skillLevel', e.target.value)
              }
              className="form-field flex-1"
              required
            >
              <option value="" disabled>
                Skill
              </option>
              {LEVEL_OPTIONS.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            {form.sports.length > 1 && (
              <button
                type="button"
                onClick={() => removeSport(idx)}
                className="text-red-600 px-2"
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addSport}
          className="form-add-btn"
        >
          + Add another sport
        </button>

        <button
          type="submit"
          disabled={saving}
          className={`form-button ${saving ? 'opacity-50' : ''}`}
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
