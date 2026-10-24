import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock } from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'

export const LoginPage: React.FC = () => {
  const { setSession } = useAuthStore()
  const navigate = useNavigate()

  const handleDevLogin = () => {
    setSession('demo-jwt-token', {
      id: 'demo-user-id',
      email: 'anna@dakhli.app',
    })
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen w-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#111827] border border-[#1F2937]/70 shadow-2xl">
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-brand font-light text-2xl leading-none select-none">+</span>
          <span className="text-xl font-bold tracking-tight text-white">Dakhli</span>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your personal finance command center
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleDevLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-slate-950 font-semibold text-xs tracking-wide transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Enter Workspace (Demo)</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#1F2937]/60 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
