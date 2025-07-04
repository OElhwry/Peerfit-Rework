// src/components/Layout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar'
import NotificationBell from './NotificationBell'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* fixed sidebar */}
      <Sidebar />

      {/* rest of the screen: a column with header + content */}
      <div className="flex flex-col flex-1">
        {/* top bar */}
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">PeerFit</h1>
          <NotificationBell />
        </header>

        {/* main content area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {/* this is where your routed pages will render */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
