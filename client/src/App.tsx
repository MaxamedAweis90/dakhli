import { Icons } from '@/assets/icons'
import { cn } from '@/lib/utils'

export default function App() {
  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex items-center justify-center p-4">
      <div
        className={cn(
          'w-full max-w-md p-6 rounded-card bg-surface-card border border-surface-subtle shadow-xl'
        )}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-brand-muted text-brand rounded-card">
            <Icons.wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-100">Dakhli</h1>
            <p className="text-xs text-slate-400">Design System & Token Foundation</p>
          </div>
        </div>

        <div className="p-4 rounded-card bg-surface-elevated flex items-center justify-between">
          <span className="text-sm text-slate-400">Net Spendable</span>
          <span className="text-xl font-bold font-mono text-status-success tabular-nums">
            $0.00
          </span>
        </div>
      </div>
    </div>
  )
}
