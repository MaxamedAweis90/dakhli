import React from 'react'
import { PiggyBank } from '@/components/shared/icons'

export const SavePlansPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-card bg-surface-card border border-surface-subtle shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-brand/10 text-brand">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Save Plans</h2>
            <p className="text-xs text-slate-400 font-mono">Route: /save-plans</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Active locked savings targets and emergency buffer hub placeholder.
        </p>
      </div>
    </div>
  )
}

export default SavePlansPage
