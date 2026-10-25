import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSavingsStore } from '@/stores/savingsStore'
import { SavePlanCard } from './components/SavePlanCard'
import { AddSavePlanModal } from './components/AddSavePlanModal'

export const SavePlansPage: React.FC = () => {
  const { plans, getActiveCount } = useSavingsStore()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const activeCount = getActiveCount()

  // General savings is the unique card; targeted plans are the rest
  const generalPlan = plans.find((p) => p.type === 'general_life')
  const targetedPlans = plans.filter((p) => p.type !== 'general_life')

  return (
    <div className="flex flex-col gap-5 pb-12 select-none">
      {/* Clean Minimalist Top Subheader */}
      <div className="flex items-center justify-between pb-1 select-none">
        <p className="text-[0.84rem] text-[#8E92A0] font-medium">
          Active Reserves: <span className="text-white font-mono">{activeCount}</span>
        </p>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-[2.35rem] px-5 rounded-xl bg-gradient-to-r from-[#F7B668] to-[#EEA850] text-[#16171B] font-semibold text-[0.84rem] shadow-[0_0_20px_rgba(247,182,104,0.3)] hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center tracking-tight"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
          Add Save Plan
        </button>
      </div>

      {/* Unique Full-Width General Savings Card (Different Size & Proportions) */}
      {generalPlan && <SavePlanCard plan={generalPlan} />}

      {/* 2-Column Grid for Targeted Save Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {targetedPlans.map((plan) => (
          <SavePlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* Add Save Plan Dialog */}
      <AddSavePlanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}

export default SavePlansPage
