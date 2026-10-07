/** Tooltip surface shared by the custom recharts tooltips. */
export function ChartTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-w-32 gap-1 border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-xl">
      {children}
    </div>
  )
}
