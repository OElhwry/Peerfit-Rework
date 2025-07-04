// src/pages/Settings.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  updatePassword
} from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase-config'

export default function Settings() {
  const { currentUser } = useAuth()
  const uid = currentUser.uid

  // form state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email: '',
    newPassword: '',
    currentPassword: '',
    notifications: {
      likes: true,
      comments: true,
      mentions: true,
      messages: true
    },
    privacy: {
      posts: 'public',
      messages: 'everyone'
    }
  })
  const [error, setError] = useState('')

  // load existing settings
  useEffect(() => {
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid))
        const data = userSnap.data() || {}
        setForm(f => ({
          ...f,
          email: currentUser.email,
          notifications: data.settings?.notifications || f.notifications,
          privacy: data.settings?.privacy || f.privacy
        }))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [uid, currentUser.email])

  // generic field handler
  const handleField = (path, value) => {
    setForm(f => {
      const next = { ...f }
      const keys = path.split('.')
      let cur = next
      keys.forEach((k,i) => {
        if (i === keys.length - 1) cur[k] = value
        else {
          cur[k] = { ...cur[k] }
          cur = cur[k]
        }
      })
      return next
    })
  }

  // reauthenticate helper
  async function reauth() {
    const cred = EmailAuthProvider.credential(
      currentUser.email,
      form.currentPassword
    )
    await reauthenticateWithCredential(currentUser, cred)
  }

  // save handler
  const handleSave = async e => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // 1) email & password
      if (form.currentPassword && form.newPassword) {
        await reauth()
        await updatePassword(currentUser, form.newPassword)
      }
      if (form.email !== currentUser.email) {
        await reauth()
        await updateEmail(currentUser, form.email)
      }

      // 2) settings in Firestore
      await updateDoc(doc(db,'users', uid), {
        'settings.notifications': form.notifications,
        'settings.privacy': form.privacy
      })

      alert('Settings saved!')
    } catch (e) {
      console.error(e)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-6 text-center">Loading…</p>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow space-y-6">
        <h1 className="text-2xl font-bold">User Settings</h1>

        {error && (
          <p className="text-red-600">{error}</p>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* EMAIL & PASSWORD */}
          <section>
            <h2 className="font-semibold mb-2">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleField('email', e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm">
                  Current password (required to change email/password)
                </label>
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={e =>
                    handleField('currentPassword', e.target.value)
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm">New password</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={e =>
                    handleField('newPassword', e.target.value)
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
          </section>

          {/* NOTIFICATION PREFERENCES */}
          <section>
            <h2 className="font-semibold mb-2">Notifications</h2>
            {Object.keys(form.notifications).map(key => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.notifications[key]}
                  onChange={e =>
                    handleField(`notifications.${key}`, e.target.checked)
                  }
                />
                <span className="capitalize">{key} alerts</span>
              </label>
            ))}
          </section>

          {/* PRIVACY */}
          <section>
            <h2 className="font-semibold mb-2">Privacy</h2>
            <div className="space-y-4">
              <div>
                <label className="block">Who can see your posts?</label>
                <select
                  value={form.privacy.posts}
                  onChange={e =>
                    handleField('privacy.posts', e.target.value)
                  }
                  className="w-full border p-2 rounded"
                >
                  <option value="public">Everyone</option>
                  <option value="connections">Connections only</option>
                  <option value="private">Only me</option>
                </select>
              </div>
              <div>
                <label className="block">Who can message you?</label>
                <select
                  value={form.privacy.messages}
                  onChange={e =>
                    handleField('privacy.messages', e.target.value)
                  }
                  className="w-full border p-2 rounded"
                >
                  <option value="everyone">Everyone</option>
                  <option value="connections">Connections only</option>
                </select>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-2 rounded text-white ${
              saving ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
