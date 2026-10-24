# Dakhli — Dashboard & AppShell Exact Visual Alignment Plan (`dashboardplan.md`)

> **Objective:** Refactor the frontend AppShell, layout containers, and Dashboard screen to achieve a 1:1 visual match with the reference interface ([`dashboard.png`](file:///c:/Users/HP/Desktop/WorkPlace/Dev_Place/dakhli/plan/ui/screens/dashboard.png) / [`example_ui.png`](file:///c:/Users/HP/Desktop/WorkPlace/Dev_Place/dakhli/plan/ui/screens/example_ui.png)).
> **Execution Strategy:** Step-by-step verification, eliminating all letterboxed containers, simulated mock borders, and generic aesthetics.

---

## 1. Full Viewport & Architecture Audit

| Component | Current Issue | Target State |
| :--- | :--- | :--- |
| **App Shell Frame** | Outer container has `p-6 flex items-center justify-center max-w-[1536px] h-[96vh] rounded-[32px]`, creating a heavy letterbox border. | **True Fullscreen Viewport:** Edge-to-edge layout filling 100% of browser window (`w-screen h-screen overflow-hidden`) with a seamless `#0D0E12` canvas. |
| **Grid Proportions** | Standard Tailwind auto-rows stretch cards unevenly on wide displays. | **Strict 3-Column, 2-Row Bento Grid:** Fixed `grid grid-cols-1 lg:grid-cols-3 gap-5` where all columns share proportional balance and height. |

---

## 2. Card-by-Card Architectural Dissection

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│ COLUMN 1 (Left)                 │ COLUMN 2 (Center)               │ COLUMN 3 (Right)                │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ [Card 1: Liquidity Summary]     │ [Card 3: Overhead Bills (Hero)] │ [Card 5: Upcoming Overhead]     │
│ - $ 260,375.03 Gross Balance    │ - Peach/Coral Gradient Surface  │ - List of 4 due bill capsules   │
│ - Split: Saved vs Net Spendable │ - Unpaid $175.03 | Paid $200.00 │ - $ amounts & checkmark icons   │
│ - Active Card Highlight Box     │ - Inner white "Quick items" box │                                 │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ [Card 2: Saving Plan]           │ [Card 4: Cash Flow]             │ [Card 6: Item Registry]         │
│ - Gym (45%) with purple ticks   │ - Income $8,385 (green wave)    │ - Essentials/Needs/Wants tabs   │
│ - Education (68%) (green ticks) │ - Expenses $2,200 (red wave)    │ - 4x2 Grid of product tiles     │
│ - Emergency (32%) (cyan ticks)  │ - Neon limit bar + hash texture │ - Mini status bars & '+' action │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

### Card 1: Liquidity Summary (Column 1, Top) — [Completed]
- **Container:** Dark matte card (`#13151B`) with `rounded-[26px]` (26px) corners and `border border-white/[0.06]`.
- **Label:** `Liquidity Summary` in text-[14px] font-medium text-slate-400.
- **Primary Metric:** Large `$ 260,375.03` with separated `$`, `text-[36px] font-semibold text-white tracking-tight tabular-nums`, subtitle `Gross Balance` (`text-xs text-slate-400 mt-1.5`) underneath.
- **Sub-Metrics Row:**
  - Left: `$118,759.97` (`text-lg font-semibold tracking-tight text-white`) + `Total Saved` (`text-xs text-slate-400`).
  - Right: `$141,615.06` (`text-lg font-semibold tracking-tight text-white`) + `Net Spendable` (`text-xs text-slate-400`).
- **Active Highlight Sub-Card:**
  - Framed with precise emerald/cyan gradient glow (`linear-gradient(120deg, #34D399 0%, #22D3EE 50%, #38BDF8 100%)` with soft ambient glow).
  - Left: `Active` in emerald green bold text (`#34D399 text-[13px] font-semibold`) + `Visual card highlight` (`text-xs text-slate-400`).
  - Right: Elevated button (`bg-[#1C202C] rounded-xl`) with `MoreHorizontal` vector icon dots.

### Card 2: Saving Plan (Column 1, Bottom) — [Completed]
- **Container:** Dark matte card (`#17181D rounded-[26px] border border-white/[0.02] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-6`).
- **Header:** `Saving plan` in text-[14px] font-semibold text-white tracking-tight mb-3.
- **Top 3 Pinned Savings:** Dynamically pulls the top 3 pinned plans from `useSavingsStore` (configured and toggleable on `/save-plans`).
- **Item Row Format:** Clean text with title on the left (`text-white font-medium text-[14px]`) and percentage on the right (`text-slate-400 font-normal text-xs tabular-nums`). No decorative emoji icons.
- **Segmented Vertical Tick Bars (42 Slender Ticks):**
  - **Compact Height:** Slender `14px` (`h-[14px] rounded-[1px] max-w-[3px] gap-[2px]`), matching the delicate aspect ratio in `part_1`.
  - **Dynamic Multi-Color Gradients:**
    - `< 50%` (e.g. Car 45%, Emergency 32%): Graded blue/indigo (`rgb(186, 215, 253)` to `rgb(99, 102, 241)`).
    - `>= 50%` (e.g. Education 68%): Samy green (`rgb(167, 243, 208)` to `rgb(16, 185, 129)`).
    - `100%`: Radiant yellow/amber (`rgb(254, 240, 138)` to `rgb(245, 158, 11)`).
  - **Inactive Ticks:** Discrete dark slate (`#20222A`) vertical tally marks.
  - **Item Separators:** Subtle horizontal hairline dividers (`divide-y divide-white/[0.04] py-3`).

### Card 3: Overhead Bills (Column 2, Top &mdash; Hero Gradient)
- **Container:** High-contrast radiant warm sunset gradient (`linear-gradient(135deg, #FF8E88 0%, #FFA885 40%, #FFF2B2 100%)`).
- **Header:** `Overhead Bills` & `This Month` in deep raspberry/coral (`#E05275`).
- **Dual Large Metrics:**
  - Left: `$175.03` in large white bold font-mono + `Unpaid` label.
  - Right: `$200.00` in large white bold font-mono + `Paid` label.
- **Nested Quick Items Box:**
  - Pure white card (`bg-white rounded-2xl p-4 text-[#2D1F24] shadow-sm`).
  - Label: `Quick items`.
  - Stacked list: `🏠 Rent`, `📶 Internet`, `🏋️ Gym`.

### Card 4: Cash Flow (Column 2, Bottom)
- **Container:** Dark matte card (`#13151B rounded-3xl`).
- **Header:** `Cash Flow` title + top-right pill toggle.
- **Dual Metrics with Undulating Sparklines:**
  - **Income:** `$8,385` + smooth **green undulating SVG wave** with glowing apex circle.
  - **Floating Center Pill:** Pure white oval pill `+$6,195` with dark bold font-mono text.
  - **Expenses:** `$2,200` + smooth **red undulating SVG wave** with glowing dip/peak circle.
- **Expenses Limit Section:**
  - Header: `Expenses limit` + `$82,300`.
  - Split graphic: Thick soft-neon lime-to-cyan gradient pill (`#CEF97A` &rarr; `#76E5FC`) on left + **dark diagonal striped/hatched texture (`///`)** on right.

### Card 5: Upcoming Overhead (Column 3, Top)
- **Container:** Dark matte card (`#13151B rounded-3xl`).
- **Header:** `Upcoming Overhead`.
- **4 Stacked Obligation Capsules (`bg-[#181B24] rounded-2xl p-3 border border-white/5`):**
  1. `Gym` (1 Dec): Dumbbell icon box + `$20` in bold white font-mono.
  2. `Rent` (17 Dec): House icon box + `$200` in bold white font-mono.
  3. `Other dues` (22 Dec): Checkmark icon box + circular green checkmark badge.
  4. `Apple Music` (22 Dec): Music note icon box + circular green checkmark badge.

### Card 6: Item Registry (Column 3, Bottom)
- **Container:** Dark matte card (`#13151B rounded-3xl`).
- **Header:** `Item Registry`.
- **Tier Selector:** Pills for `Essentials` (active solid pill), `Future Needs`, `Wants`.
- **4×2 Visual Item Grid:**
  - 8 rounded-2xl tiles (`bg-[#181B24] border border-white/5`):
    - Tile 1: Bottle (`🧴`) + `Tier` badge.
    - Tile 2: Sneaker (`👟`) + glowing green horizontal mini-bar indicator.
    - Tile 3: Basketball (`🏀`).
    - Tile 4: Tag (`🏷️`) + `Tier` badge.
    - Tile 5: Cup (`🥛`) + `Tier` badge.
    - Tile 6: Books (`📚`) + `Tier` badge.
    - Tile 7: Shopping Bag (`🛍️`) + amber mini-bar indicator.
    - Tile 8: Dashed border tile with clean `+` add icon.

---

## 3. Step-by-Step Implementation Roadmap

- [ ] **Step 1: True Fullscreen Viewport & Frame Removal**
  - Modify [`AppShell.tsx`](file:///c:/Users/HP/Desktop/WorkPlace/Dev_Place/dakhli/client/src/components/layout/AppShell.tsx) to eliminate outer centering padding, max-width constraints, and dark letterbox margins.
  - Ensure sidebar and main content canvas stretch flush across 100vw × 100vh.

- [ ] **Step 2: Sidebar & Header Exact Pixel Alignment**
  - Verify brand header `✦ Dakhli` and search pill geometry.
  - Ensure active navigation pill uses exact `#1A1D26` surface.
  - Align header greeting `Hello, Anna!` and top-right `Ask AI` + date pills.

- [ ] **Step 3: Column 1 Refactoring**
  - Fine-tune `LiquidityBanner` spacing, font sizes, and gradient-highlight active card.
  - Implement full-width segmented vertical tally ticks (`SegmentedTicks`) in `SavingPlanCard`.

- [ ] **Step 4: Column 2 Refactoring**
  - Align exact peach-to-coral sunset gradient on `OverheadBillsCard` and nested white quick-items capsule.
  - Build inline SVG green & red sparklines and hatched limit bar in `CashFlowCard`.

- [ ] **Step 5: Column 3 Refactoring**
  - Style `UpcomingOverheadCard` with dark icon boxes and paid checkmark pills.
  - Assemble `ItemRegistryCard` 4×2 grid with custom product emojis and status indicator mini-bars.

- [ ] **Step 6: Quality Assurance & Build Verification**
  - Execute `pnpm run lint` and `pnpm run build` to confirm 0 errors and 0 warnings.
  - Visual inspection against `dashboard.png`.
