// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase-config'

const SPORT_OPTIONS = [
  'Soccer',
  'Basketball',
  'Tennis',
  'Volleyball',
  'Running',
  // …add more as desired
]
const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']

export default function Profile() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // form state
  const [form, setForm] = useState({
    displayName: '',
    location: '',
    sports: [{ sport: '', skillLevel: '' }],
  })

  // loading & saving indicators
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // load existing profile once
  useEffect(() => {
    if (!currentUser) return

    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid))
        if (snap.exists()) {
          setForm(snap.data())
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [currentUser])

  // handlers
  const handleChange = (idx, field, value) => {
    setForm(f => {
      const newSports = [...f.sports]
      newSports[idx] = { ...newSports[idx], [field]: value }
      return { ...f, sports: newSports }
    })
  }

  const addSport = () => {
    setForm(f => ({
      ...f,
      sports: [...f.sports, { sport: '', skillLevel: '' }],
    }))
  }

  const removeSport = idx => {
    setForm(f => ({
      ...f,
      sports: f.sports.filter((_, i) => i !== idx),
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', currentUser.uid), form, { merge: true })
      navigate('/')
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }


  if (loading) return <p className="p-4">Loading profile…</p>

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-card space-y-4">
        {/* Name + Location */}
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

        {/* Sports selectors */}
        {form.sports.map((entry, idx) => {
          // build list of sports taken by other entries
          const taken = form.sports
            .filter((_, i) => i !== idx)
            .map(e => e.sport)
            .filter(Boolean)

          // available = all options minus those taken (plus current value)
          const available = SPORT_OPTIONS.filter(
            s => !taken.includes(s) || s === entry.sport
          )

          return (
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
                {available.map(s => (
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
          )
        })}

        {/* Add another + Save */}
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
