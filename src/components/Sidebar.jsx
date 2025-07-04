// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom"
import { HiHome, HiUser, HiUsers, HiChat, HiOutlineLogout } from "react-icons/hi"
import { useAuth } from "../contexts/AuthContext"
import { signOut } from "firebase/auth"
import { auth } from "../../firebase-config"
import NotificationBell from './NotificationBell'

function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow">
      <h1 className="text-lg font-semibold">PeerFit</h1>
      <div className="flex items-center space-x-4">
        <NotificationBell />
      </div>
    </header>
  )
}


export default function Sidebar() {
  const { currentUser } = useAuth()

  const handleSignOut = async () => {
    await signOut(auth)
    window.location.href = "/login"
  }

  const links = [
    { to: "/",       label: "Home",     icon: HiHome },
    { to: "/profile",label: "Profile",  icon: HiUser },
    { to: "/matches",label: "Matches",  icon: HiUsers },
    { to: "/chats",  label: "Messages", icon: HiChat },
  ]

  return (
    <aside className="w-64 fixed h-full bg-white shadow-lg flex flex-col">
      <div className="p-6 font-bold text-xl text-primary">PeerFit</div>
      <nav className="flex-1">
        {links.map(({to,label,icon:Icon})=>(
          <NavLink
            key={to}
            to={to}
            className={({isActive})=>
              `flex items-center px-6 py-3 text-muted hover:text-accent ${
                isActive ? "bg-gray-100 text-accent" : ""
              }`
            }
          >
            <Icon className="mr-3 text-lg"/> {label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleSignOut}
        className="flex items-center px-6 py-3 text-red-600 hover:bg-gray-100"
      >
        <HiOutlineLogout className="mr-3 text-lg"/> Sign Out
      </button>
    </aside>
  )
}
