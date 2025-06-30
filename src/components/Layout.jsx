// src/components/Layout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar'

export default function Layout() {
  return (
    <div className="flex font-sans">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-gray-50 p-8">
        {/* this is where the “inner” page will render */}
        <Outlet />
      </main>
    </div>
  )
}
