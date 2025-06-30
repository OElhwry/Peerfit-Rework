// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase-config'

const SPORT_OPTIONS = [
  'Soccer',
  'Basketball',
  'Tennis',
  'Volleyball',
  'Running',
  // …add more
]

export default function Profile() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    displayName: '',
    location: '',
    sports: [{ sport: '', skillLevel: '', yearsPlaying: 0 }],
  })

  // load existing profile
  useEffect(() => {
    async function load() {
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
    load()
  }, [currentUser.uid])

  const handleChange = (idx, field, value) => {
    setForm(f => {
      const sports = [...f.sports]
      sports[idx] = { ...sports[idx], [field]: value }
      return { ...f, sports }
    })
  }

  const addSport = () =>
    setForm(f => ({
      ...f,
      sports: [...f.sports, { sport: '', skillLevel: '', yearsPlaying: 0 }],
    }))

  const removeSport = idx =>
    setForm(f => ({
      ...f,
      sports: f.sports.filter((_, i) => i !== idx),
    }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          displayName: form.displayName,
          location: form.location,
          sports: form.sports,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      )
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your profile…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">Your Profile</h2>

        {/* Full Name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            value={form.displayName}
            onChange={e =>
              setForm(f => ({ ...f, displayName: e.target.value }))
            }
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring"
            required
          />
        </div>

        {/* Location */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={e =>
              setForm(f => ({ ...f, location: e.target.value }))
            }
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring"
            required
          />
        </div>

        {/* Sports List */}
        <div className="space-y-4">
          {form.sports.map((entry, idx) => {
            // filter out already-selected sports
            const taken = form.sports
              .map((s, i) => (i !== idx ? s.sport : null))
              .filter(Boolean)
            const available = SPORT_OPTIONS.filter(
              s => !taken.includes(s) || s === entry.sport
            )
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                {/* Sport */}
                <select
                  value={entry.sport}
                  onChange={e =>
                    handleChange(idx, 'sport', e.target.value)
                  }
                  className="col-span-5 p-2 border rounded-lg focus:outline-none focus:ring"
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

                {/* Skill Level */}
                <select
                  value={entry.skillLevel}
                  onChange={e =>
                    handleChange(idx, 'skillLevel', e.target.value)
                  }
                  className="col-span-4 p-2 border rounded-lg focus:outline-none focus:ring"
                  required
                >
                  <option value="" disabled>
                    Skill level
                  </option>
                  {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>

                  {/* Years Playing */}
                  <div className="col-span-2 flex items-center">
                    <input
                      type="number"
                      min={0}
                      value={entry.yearsPlaying}
                      onChange={e =>
                        handleChange(idx, 'yearsPlaying', Number(e.target.value))
                      }
                      className="w-16 p-2 border rounded-lg focus:outline-none focus:ring"
                      placeholder="0"
                      required
                    />
                    <span className="ml-2 text-gray-600 text-sm">yrs</span>
                  </div>


                {/* Remove Button */}
                {form.sports.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSport(idx)}
                    className="col-span-1 text-red-600 text-xl"
                    title="Remove sport"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={addSport}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Add another sport
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={`w-full py-3 rounded-lg text-white font-medium transition ${
            saving ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
