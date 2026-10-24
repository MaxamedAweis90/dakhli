import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const AppShell: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#111215] text-slate-100 flex">
      {/* Left Rail */}
      <Sidebar />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-2">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
