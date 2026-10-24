import React, { useState } from 'react'
import { OverheadBillsLedgerBanner } from './components/OverheadBillsLedgerBanner'
import { MonthlyBillingRibbonCard } from './components/MonthlyBillingRibbonCard'
import { OverheadLedgerTable } from './components/OverheadLedgerTable'
import { AddBillModal } from './components/AddBillModal'
import { useOverheadsStore } from '@/stores/overheadsStore'

export const OverheadsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const {
    bills,
    toggleBillPaid,
    addBill,
    getTotalOverhead,
    getTotalPaid,
    getTotalUnpaid,
    getPaidPercentage,
  } = useOverheadsStore()

  return (
    <div className="flex flex-col gap-4 lg:gap-5 pb-12">
      {/* Section 1: Overhead Bills Ledger Summary Card with enlarged numbers */}
      <OverheadBillsLedgerBanner
        totalOverhead={getTotalOverhead()}
        totalPaid={getTotalPaid()}
        totalUnpaid={getTotalUnpaid()}
      />

      {/* Section 2: Dedicated Monthly Billing Ribbon Card & Add Bill Action */}
      <MonthlyBillingRibbonCard
        percentage={getPaidPercentage()}
        onAddBill={() => setIsAddModalOpen(true)}
      />

      {/* Section 3: Bills Ledger Table Card */}
      <OverheadLedgerTable
        bills={bills}
        onTogglePaid={toggleBillPaid}
      />

      {/* Add Bill Modal */}
      <AddBillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addBill}
      />
    </div>
  )
}

export default OverheadsPage
