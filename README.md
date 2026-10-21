# Dakhli (`دخلي`) — Cash Flow & Money Discipline Engine

> A privacy-first, manual personal finance engine designed for deliberate cash management. Built without invasive third-party bank connections, Dakhli empowers users to establish strict daily spending discipline, map non-negotiable overhead, isolate active spendable liquidity from savings reserves, and prioritize capital allocations through a synchronized purchase registry.

---

## 📊 Project Status

| Metric | Current State |
| :--- | :--- |
| **Project Status** | 🟡 **Planning** |
| **Progress** | **28%** |
| **Milestone** | Architecture & Specifications Ready → Core Scaffolding |

```text
Progress: [██████░░░░░░░░░░░░░░] 28%
```

---

## 🏛️ System Architecture & Financial Logic

Dakhli is engineered around deterministic financial rules rather than passive retroactive tracking. The platform operates on four foundational pillars:

### 1. Liquidity Isolation (Net Spendable vs. Gross Balance)
- **Net Spendable Balance (Default View):** Real spendable liquidity calculated as:
  $$\text{Net Spendable Balance} = \text{Gross Balance} - \sum(\text{Active Savings Plans})$$
- **Gross Balance View:** Available via an instant toggle on the primary balance card for total asset visibility.
- **Save Shortcut:** Direct summary badge providing zero-click access into allocated reserve funds.

### 2. Payday Anchors & Income Cycles
- **Custom Payday Alignment:** Supports mid-month or offset paydays (e.g., 25th of prior month or 5th of current month) directly mapped to fund a designated budget calendar month.
- **Targeted Cash Injections:**
  - *One-time adjustments* (bonuses, unexpected inflows) modify strictly the active cycle.
  - *Recurring base salary changes* apply cleanly to future billing cycles without mutating in-flight budgets.

### 3. Daily Spending Caps with Zero-Double-Counting
- **Day-Specific Expense Templates:** Custom caps assigned to weekdays vs. weekends.
- **End-of-Day Reconciliation:**
  - **Under Cap:** Preserves unspent cash in the main balance and logs positive discipline into a **"Daily Savings"** tracker.
  - **Over Cap:** Deducts overage from balance and reflects negative delta in daily performance metrics.
  - **Zero-Double-Count Metric:** The Daily Savings pool operates as a preview/performance metric; it does not freeze cash already tracked in the main balance.

### 4. Reserve Pools & 3-Tier Registry Synchronization
- **Active Saving Plans:** Concrete reserve allocations (Emergency Rent/Job-Loss, General Savings, or Specific Planned Purchases) that lock liquidity out of the Net Spendable balance.
- **3-Tier Registry (`Essentials`, `Future Needs`, `Wants`):**
  - Items are zero-impact until explicitly funded or purchased.
  - When an item is loaded into an active Save Plan, it visually synchronizes inside the registry with a distinct state badge (`In Saving Plan`).
  - Plan completion deducts target funds from the saved pool with zero redundant hit to net spendable liquidity.

---

## 💻 Tech Stack

### Frontend Client (`/client`)
- **Core Framework:** React 18+ with TypeScript via Vite
- **Styling & Design Tokens:** TailwindCSS
- **Motion & Micro-interactions:** Motion (Framer Motion)
- **State Management:** Zustand (decoupled client state)
- **Server Cache & Synchronization:** TanStack Query (React Query)
- **Iconography:** Lucide React

### Backend Service (`/server`)
- **Runtime:** Node.js (LTS)
- **Application Framework:** Express with strict TypeScript compilation
- **Database & ODM:** MongoDB with Mongoose schema validation
- **Authentication & Security:** JWT (JSON Web Tokens), bcrypt password hashing, CORS, Helmet
- **Testing & API Verification:** REST API test suites & LiteClient collections

---

## 📁 Repository Directory Structure

```text
dakhli/
├── .env.example              # Centralized environment variable template
├── .gitignore                # Production ignore definitions
├── README.md                 # Primary system manual & project status tracker
│
├── server/                   # Backend API service
│   └── src/
│       ├── config/           # Database connections and runtime environment
│       ├── controllers/      # Route request/response orchestration
│       ├── models/           # Mongoose domain models & calculation helpers
│       ├── routes/           # REST endpoint definitions
│       └── middleware/       # JWT auth, validation, and error guards
│
└── client/                   # Single Page Application
    └── src/
        ├── components/       # Shared UI components & design system primitives
        ├── features/         # Domain-driven screens (Balance, Daily, Save, Registry)
        ├── hooks/            # TanStack Query hooks & custom logic
        └── stores/           # Zustand global state slices
```

---

## 🚀 Environment & Setup

### Prerequisites
- **Node.js:** `>= 18.x`
- **npm:** `>= 9.x`
- **MongoDB:** Active local daemon or MongoDB Atlas cluster connection string

### Environment Variables
Copy `.env.example` into `server/.env` and supply your secrets:

```bash
cp .env.example server/.env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | API Server listening port | `5000` |
| `NODE_ENV` | Runtime environment mode | `development` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used for signing auth tokens | `your_jwt_super_secret_key` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `CLIENT_URL` | Permitted origin for CORS | `http://localhost:5173` |
