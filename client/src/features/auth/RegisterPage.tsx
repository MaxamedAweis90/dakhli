import React from 'react'
import { Link } from 'react-router-dom'
import { User } from '@/components/shared/icons'

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen w-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#111827] border border-[#1F2937]/70 shadow-2xl">
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-brand font-light text-2xl leading-none select-none">+</span>
          <span className="text-xl font-bold tracking-tight text-white">Dakhli</span>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Scaffolded register screen ready for Phase 6 form
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-elevated/40 border border-[#1F2937]/60 text-xs text-slate-400 flex items-center space-x-2.5">
            <User className="w-4 h-4 text-slate-400" />
            <span>Registration endpoint: <code>/api/v1/auth/register</code></span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#1F2937]/60 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
