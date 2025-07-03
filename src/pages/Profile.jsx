// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { db, storage, auth } from '../../firebase-config'  // make sure storage & auth are exported

const SPORT_OPTIONS = [
  'Soccer','Basketball','Tennis','Volleyball','Running',
  'Swimming','Cycling','Yoga','Pilates','Weightlifting',
]
const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']

export default function Profile() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // form state
  const [photoFile, setPhotoFile] = useState(null)
  const [previewURL, setPreviewURL] = useState('')
  const [form, setForm] = useState({
    displayName: '',
    location: '',
    bio: '',
    interests: '',
    sports: [{ sport: '', skillLevel: '', yearsPlaying: 0 }],
    photoURL: '',
  })

  // load existing profile from Firestore
  useEffect(() => {
    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setForm({
            displayName: data.displayName || '',
            location: data.location || '',
            bio: data.bio || '',
            interests: data.interests || '',
            sports: Array.isArray(data.sports) && data.sports.length
              ? data.sports
              : [{ sport: '', skillLevel: '', yearsPlaying: 0 }],
            photoURL: data.photoURL || '',
          })
          setPreviewURL(data.photoURL || '')
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [currentUser.uid])

  // handle avatar file selection + preview
  const handlePhotoChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPreviewURL(URL.createObjectURL(file))
  }

  // generic field change
  const handleFieldChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  // sports subfield change
  const handleSportChange = (idx, field, value) => {
    setForm(f => {
      const sports = [...f.sports]
      sports[idx] = { ...sports[idx], [field]: value }
      return { ...f, sports }
    })
  }

  // add / remove sports row
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

  // on form submit
  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    let photoURL = form.photoURL

    try {
      // 1️⃣ upload new avatar if chosen
      if (photoFile) {
        const avatarRef = storageRef(storage, `avatars/${currentUser.uid}`)
        await uploadBytes(avatarRef, photoFile)
        photoURL = await getDownloadURL(avatarRef)
        // also update Firebase Auth profile photoURL
        await updateProfile(auth.currentUser, { photoURL })
      }

      // 2️⃣ write to Firestore
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          displayName: form.displayName,
          location: form.location,
          bio: form.bio,
          interests: form.interests,
          sports: form.sports,
          photoURL,
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-lg p-6 space-y-6"
        >
          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Your Profile
          </h2>

          {/* Avatar */}
          <div className="flex flex-col items-center">
            {previewURL ? (
              <img
                src={previewURL}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-2" />
            )}
            <label className="text-sm text-gray-600 cursor-pointer">
              Change Avatar
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="mt-1"
              />
            </label>
          </div>

          {/* Name & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.displayName}
              onChange={e =>
                handleFieldChange('displayName', e.target.value)
              }
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring"
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={form.location}
              onChange={e => handleFieldChange('location', e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring"
              required
            />
          </div>

          {/* Bio & Interests */}
          <div className="space-y-4">
            <textarea
              rows={3}
              placeholder="Bio (e.g. ‘College tennis player…’)"
              value={form.bio}
              onChange={e => handleFieldChange('bio', e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring"
            />
            <input
              type="text"
              placeholder="Interests (comma-separated)"
              value={form.interests}
              onChange={e => handleFieldChange('interests', e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring"
            />
          </div>

          {/* Sports List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Your Sports
            </h3>

            {form.sports.map((entry, idx) => {
              // exclude already-chosen sports
              const taken = form.sports
                .filter((_, i) => i !== idx)
                .map(s => s.sport)
              const options = SPORT_OPTIONS.filter(
                s => !taken.includes(s) || s === entry.sport
              )

              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <select
                    value={entry.sport}
                    onChange={e =>
                      handleSportChange(idx, 'sport', e.target.value)
                    }
                    className="col-span-5 p-2 border rounded-lg focus:outline-none focus:ring"
                    required
                  >
                    <option value="" disabled>
                      Pick a sport
                    </option>
                    {options.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={entry.skillLevel}
                    onChange={e =>
                      handleSportChange(idx, 'skillLevel', e.target.value)
                    }
                    className="col-span-4 p-2 border rounded-lg focus:outline-none focus:ring"
                    required
                  >
                    <option value="" disabled>
                      Skill level
                    </option>
                    {LEVEL_OPTIONS.map(l => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>

                  <div className="col-span-2 flex items-center">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={entry.yearsPlaying}
                      onChange={e =>
                        handleSportChange(
                          idx,
                          'yearsPlaying',
                          Number(e.target.value)
                        )
                      }
                      className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring"
                      required
                    />
                    <span className="ml-2 text-gray-600 text-sm">yrs</span>
                  </div>

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
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              + Add another sport
            </button>
          </div>

          {/* Save */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`w-full py-2 rounded-lg text-white font-medium transition ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
