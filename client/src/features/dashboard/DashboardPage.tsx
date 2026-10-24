import React from 'react'
import { LiquidityBanner } from './components/LiquidityBanner'
import { SavingPlanCard } from './components/SavingPlanCard'
import { OverheadBillsCard } from './components/OverheadBillsCard'
import { CashFlowCard } from './components/CashFlowCard'
import { UpcomingOverheadCard } from './components/UpcomingOverheadCard'
import { ItemRegistryCard } from './components/ItemRegistryCard'

/**
 * Layout is expressed in reference pixels (see `--u` in index.css) taken from dashboard.png:
 *   left area 477 | right column 236, gap 13
 *   top row 251 | 214, bottom row 197 | 267, row heights 253 / 303
 * Below `lg` the cards stack and keep their natural reference heights.
 */
export const DashboardPage: React.FC = () => {
  return (
    <div className="grid gap-[0.8125rem] px-0 lg:grid-cols-[477fr_236fr] items-start pb-8">
      {/* ================= LEFT AREA (cols 1 + 2) ================= */}
      <div className="flex flex-col gap-[0.8125rem]">
        {/* Top row: Liquidity + Overhead Bills */}
        <div className="grid gap-[0.8125rem] md:grid-cols-[251fr_214fr] items-stretch">
          <LiquidityBanner className="h-full" />
          <OverheadBillsCard className="h-full" />
        </div>

        {/* Bottom row: Saving plan + Cash Flow */}
        <div className="grid gap-[0.8125rem] md:grid-cols-[197fr_267fr] items-stretch">
          <SavingPlanCard className="h-full" />
          <CashFlowCard className="h-full" />
        </div>
      </div>

      {/* ================= RIGHT COLUMN ================= */}
      <div className="flex flex-col gap-[0.8125rem]">
        <UpcomingOverheadCard className="h-auto" />
        <ItemRegistryCard className="h-auto" />
      </div>
    </div>
  )
}

export default DashboardPage
