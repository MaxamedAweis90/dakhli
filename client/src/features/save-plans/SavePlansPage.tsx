import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { SavePlanCard } from './components/SavePlanCard'
import { AddSavePlanModal } from './components/AddSavePlanModal'
import { useSavePlans } from './hooks/useSavePlans'
import { useBaseline } from '@/features/settings/hooks/useBaseline'

export const SavePlansPage: React.FC = () => {
  useBaseline()
  const {
    plans,
    activeCount,
    createPlan,
    depositToPlan,
    completePlan,
    cancelPlan,
    toggleActive,
    togglePin,
    deletePlan,
    isCreating,
    isMutationPending,
  } = useSavePlans()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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

      {/* Empty State when no plans exist yet */}
      {plans.length === 0 && (
        <div className="rounded-[1.25rem] bg-[#17181D] border border-white/[0.04] p-12 text-center shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
          <p className="text-[0.92rem] text-[#8E92A0]">
            No save plans or reserve buckets recorded yet. Click{' '}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-[#F7B668] font-medium hover:underline cursor-pointer"
            >
              "Add Save Plan"
            </button>{' '}
            to create your first reserve goal.
          </p>
        </div>
      )}

      {/* Unique Full-Width General Savings Card (Different Size & Proportions) */}
      {generalPlan && (
        <SavePlanCard
          plan={generalPlan}
          onDeposit={depositToPlan}
          onToggleActive={toggleActive}
          onCancel={cancelPlan}
          onComplete={completePlan}
          onTogglePin={togglePin}
          onDelete={deletePlan}
          isMutating={isMutationPending}
        />
      )}

      {/* 2-Column Grid for Targeted Save Plans */}
      {targetedPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {targetedPlans.map((plan) => (
            <SavePlanCard
              key={plan.id}
              plan={plan}
              onDeposit={depositToPlan}
              onToggleActive={toggleActive}
              onCancel={cancelPlan}
              onComplete={completePlan}
              onTogglePin={togglePin}
              onDelete={deletePlan}
              isMutating={isMutationPending}
            />
          ))}
        </div>
      )}

      {/* Add Save Plan Dialog */}
      <AddSavePlanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={createPlan}
        isSubmitting={isCreating}
      />
    </div>
  )
}

export default SavePlansPage
