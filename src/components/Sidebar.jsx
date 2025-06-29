import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',    label: 'Home' },
  { to: '/profile',       label: 'Edit Profile' },
  { to: '/matches',       label: 'Matches' },
  { to: '/chats',         label: 'Messages' },
]

export default function Sidebar() {
  return (
    <nav className="w-60 h-screen bg-white shadow flex flex-col p-4 space-y-4">
      <h2 className="text-xl font-bold mb-6">PeerFit</h2>
      {navItems.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `px-3 py-2 rounded ${
              isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
      <button
        onClick={() => {
          // you'll import signOut & useNavigate here
        }}
        className="mt-auto px-3 py-2 text-red-600 hover:bg-gray-100 rounded"
      >
        Sign Out
      </button>
    </nav>
  )
}