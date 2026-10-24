import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, User } from '@/components/shared/icons'

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen w-screen bg-canvas text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm p-8 rounded-card bg-surface-card border border-surface-subtle shadow-2xl">
        <div className="flex items-center space-x-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Dakhli</span>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Scaffolded register screen ready for Phase 6 form
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-elevated/40 border border-surface-subtle/60 text-xs text-slate-400 flex items-center space-x-2.5">
            <User className="w-4 h-4 text-slate-400" />
            <span>Registration endpoint: <code>/api/v1/auth/register</code></span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-surface-subtle text-center">
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
