import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-slate-100 font-sans">
      {/* Persistent Left Rail */}
      <Sidebar />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Persistent Top Header */}
        <Header />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 bg-canvas">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
