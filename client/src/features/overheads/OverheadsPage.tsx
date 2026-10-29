import React, { useState } from 'react'
import { OverheadBillsLedgerBanner } from './components/OverheadBillsLedgerBanner'
import { MonthlyBillingRibbonCard } from './components/MonthlyBillingRibbonCard'
import { OverheadLedgerTable } from './components/OverheadLedgerTable'
import { AddBillModal } from './components/AddBillModal'
import { useOverheads } from './hooks/useOverheads'
import { useOverheadsStore } from '@/stores/overheadsStore'
import type { OverheadStatus } from './types/overhead.types'

export const OverheadsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { currentMonth } = useOverheadsStore()
  const {
    bills,
    summary,
    createOverhead,
    updateStatus,
    deleteOverhead,
    isCreating,
    isUpdatingStatus,
  } = useOverheads(currentMonth)

  const handleTogglePaid = (id: string, currentStatus: OverheadStatus) => {
    updateStatus({
      id,
      status: currentStatus === 'paid' ? 'unpaid' : 'paid',
    })
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-5 pb-12">
      {/* Section 1: Overhead Bills Ledger Summary Card with enlarged numbers */}
      <OverheadBillsLedgerBanner
        totalOverhead={summary.totalMonthly}
        totalPaid={summary.totalPaid}
        totalUnpaid={summary.totalUnpaid}
      />

      {/* Section 2: Dedicated Monthly Billing Ribbon Card & Add Bill Action */}
      <MonthlyBillingRibbonCard
        percentage={summary.percentagePaid}
        onAddBill={() => setIsAddModalOpen(true)}
      />

      {/* Section 3: Bills Ledger Table Card */}
      <OverheadLedgerTable
        bills={bills}
        onTogglePaid={handleTogglePaid}
        onDeleteBill={deleteOverhead}
        isUpdating={isUpdatingStatus}
      />

      {/* Add Bill Modal */}
      <AddBillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={createOverhead}
        isSubmitting={isCreating}
      />
    </div>
  )
}

export default OverheadsPage
