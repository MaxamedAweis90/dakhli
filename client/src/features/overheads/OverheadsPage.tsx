import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { OverheadBillsLedgerBanner } from './components/OverheadBillsLedgerBanner'
import { MonthlyBillingRibbonCard } from './components/MonthlyBillingRibbonCard'
import { OverheadLedgerTable } from './components/OverheadLedgerTable'
import { AddBillModal } from './components/AddBillModal'
import { EditBillModal } from './components/EditBillModal'
import { useOverheads } from './hooks/useOverheads'
import {
  useOverheadsStore,
  getRealCurrentMonth,
  getMaxFutureMonth,
} from '@/stores/overheadsStore'
import { useAuthStore } from '@/stores/authStore'
import type { OverheadBill, OverheadStatus, UpdateOverheadPayload } from './types/overhead.types'

export const OverheadsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<OverheadBill | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { currentMonth, setMonth } = useOverheadsStore()

  const realCurrentMonth = getRealCurrentMonth()
  const userCreatedAtMonth = user?.createdAt ? user.createdAt.slice(0, 7) : realCurrentMonth
  const maxFutureMonth = getMaxFutureMonth(realCurrentMonth, 3)

  const isInitialMount = useRef(true)

  // 1. Initial deep-link mount & external URL query clamping (once on mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      const cycleParam = searchParams.get('cycle')
      if (cycleParam) {
        let clamped = cycleParam.slice(0, 7)
        if (clamped < userCreatedAtMonth) clamped = userCreatedAtMonth
        if (clamped > maxFutureMonth) clamped = maxFutureMonth

        if (clamped !== cycleParam) {
          setSearchParams({ cycle: clamped }, { replace: true })
        }
        if (clamped !== currentMonth) {
          setMonth(clamped, userCreatedAtMonth, maxFutureMonth)
        }
      } else {
        // If no cycle query, set URL parameter to current month without altering store
        setSearchParams({ cycle: currentMonth }, { replace: true })
      }
    }
  }, [searchParams, userCreatedAtMonth, maxFutureMonth, currentMonth, setMonth, setSearchParams])

  // 2. Unidirectional URL synchronization when active month toggles in Header
  useEffect(() => {
    if (searchParams.get('cycle') !== currentMonth) {
      setSearchParams({ cycle: currentMonth }, { replace: true })
    }
  }, [currentMonth, searchParams, setSearchParams])

  const {
    bills,
    summary,
    isCurrentCycle,
    isFutureCycle,
    isPastCycle,
    createOverhead,
    updateOverhead,
    toggleActive,
    updateStatus,
    deleteOverhead,
    isCreating,
    isUpdatingOverhead,
    isTogglingActive,
    isUpdatingStatus,
    isDeleting,
  } = useOverheads(currentMonth)

  const handleTogglePaid = (id: string, currentStatus: OverheadStatus) => {
    if (isPastCycle) return
    updateStatus({
      id,
      status: currentStatus === 'paid' ? 'unpaid' : 'paid',
    })
  }

  const handleSaveEdit = async (id: string, payload: UpdateOverheadPayload) => {
    await updateOverhead(id, payload)
    setEditingBill(null)
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-5 pb-12">
      {/* Section 1: Overhead Bills Ledger Summary Card with enlarged numbers & dynamic cycle projection */}
      <OverheadBillsLedgerBanner
        totalOverhead={summary.totalMonthly}
        totalPaid={summary.totalPaid}
        totalUnpaid={summary.totalUnpaid}
        isFutureCycle={isFutureCycle}
        isPastCycle={isPastCycle}
      />

      {/* Section 2: Dedicated Monthly Billing Ribbon Card & Add Bill Action */}
      <MonthlyBillingRibbonCard
        percentage={summary.percentagePaid}
        onAddBill={() => setIsAddModalOpen(true)}
        isPastCycle={isPastCycle}
      />

      {/* Section 3: Bills Ledger Table Card with 3-dot vertical dropdown */}
      <OverheadLedgerTable
        bills={bills}
        onTogglePaid={handleTogglePaid}
        onEditBill={(bill) => setEditingBill(bill)}
        onToggleActive={(id, currentActive) => toggleActive(id, currentActive)}
        onDeleteBill={(id) => deleteOverhead(id)}
        isCurrentCycle={isCurrentCycle}
        isFutureCycle={isFutureCycle}
        isPastCycle={isPastCycle}
        isUpdating={
          isUpdatingStatus ||
          isUpdatingOverhead ||
          isTogglingActive ||
          isDeleting
        }
      />

      {/* Add Bill Modal */}
      <AddBillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={createOverhead}
        isSubmitting={isCreating}
      />

      {/* Edit Bill Modal */}
      <EditBillModal
        isOpen={Boolean(editingBill)}
        bill={editingBill}
        onClose={() => setEditingBill(null)}
        onSave={handleSaveEdit}
        isSubmitting={isUpdatingOverhead}
      />
    </div>
  )
}

export default OverheadsPage
