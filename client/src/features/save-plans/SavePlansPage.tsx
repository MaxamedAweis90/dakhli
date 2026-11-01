import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { CumulativeReserveHeroCard } from './components/CumulativeReserveHeroCard'
import { SystemReserveDrawer } from './components/SystemReserveDrawer'
import { SavePlanCard } from './components/SavePlanCard'
import { AddSavePlanModal } from './components/AddSavePlanModal'
import { useSavePlans } from './hooks/useSavePlans'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import type { SavePlan } from './types/savePlan.types'

export const SavePlansPage: React.FC = () => {
  useBaseline()
  const {
    systemReservePlan,
    targetedPlans,
    activeCount,
    createPlan,
    depositToPlan,
    completePlan,
    cancelPlan,
    toggleActive,
    toggleReserveStatus,
    togglePin,
    updatePlan,
    deletePlan,
    isCreating,
    isMutationPending,
  } = useSavePlans()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Fallback initial baseline reserve if query hasn't populated yet
  const defaultSystemReserve: SavePlan = {
    id: 'plan-system-reserve',
    userId: '',
    title: 'Cumulative Baseline Reserve',
    name: 'Cumulative Baseline Reserve',
    category: 'general',
    type: 'system_baseline',
    targetAmount: 25000,
    currentAmount: 14500,
    currentSaved: 14500,
    percentage: 58,
    isPinned: true,
    status: 'ACTIVE',
    isSystemDefault: true,
    isRemovable: false,
    monthlyDeduction: 300,
    targetCycleWindow: 'PERPETUAL',
    sourceBalance: 'BASELINE_INCOME',
    cumulativeTotal: 14500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const effectiveReservePlan = systemReservePlan || defaultSystemReserve

  const handleToggleStatus = async (id: string) => {
    if (systemReservePlan) {
      await toggleReserveStatus(id)
    }
  }

  const handleSaveDrawerConfig = async (updates: Partial<SavePlan>) => {
    if (systemReservePlan) {
      await updatePlan({
        id: systemReservePlan.id,
        updates,
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      {/* 1. Primary Anchor Position: Cumulative Baseline Reserve Hero Card */}
      <CumulativeReserveHeroCard
        plan={effectiveReservePlan}
        onToggleStatus={handleToggleStatus}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        isMutating={isMutationPending}
      />

      {/* 2. Subheader for Targeted Savings Goals */}
      <div className="flex items-center justify-between pt-2 pb-1 select-none">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#8E92A0] font-semibold">
            TARGETED SAVINGS BUCKETS
          </h2>
          <p className="text-[0.8rem] text-slate-500 font-mono mt-0.5">
            Active Targets: <span className="text-white font-medium">{activeCount}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-[2.35rem] px-5 rounded-xl bg-gradient-to-r from-[#F7B668] to-[#EEA850] text-[#16171B] font-semibold text-[0.84rem] shadow-[0_0_20px_rgba(247,182,104,0.3)] hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center tracking-tight"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
          Add Save Plan
        </button>
      </div>

      {/* 3. Empty State when no targeted plans exist */}
      {targetedPlans.length === 0 && (
        <div className="rounded-[1.25rem] bg-[#13151B] border border-white/[0.04] p-10 text-center shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
          <p className="text-[0.9rem] text-[#8E92A0]">
            No targeted goal buckets configured yet. Click{' '}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-[#F7B668] font-medium hover:underline cursor-pointer"
            >
              "Add Save Plan"
            </button>{' '}
            to allocate dedicated funds for specific targets.
          </p>
        </div>
      )}

      {/* 4. 2-Column Grid for Targeted Save Plans (unaltered standard cards) */}
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

      {/* 5. System Reserve Configuration Drawer */}
      <SystemReserveDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        plan={effectiveReservePlan}
        onSave={handleSaveDrawerConfig}
        isMutating={isMutationPending}
      />

      {/* 6. Standard Add Save Plan Dialog */}
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
