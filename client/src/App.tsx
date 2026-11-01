import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { useAuthStore } from './stores/authStore'

export const App: React.FC = () => {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <RouterProvider router={router} />
}

export default App

