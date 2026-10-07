import { cn } from "cn"

import { formatScore } from "@/lib/format"

interface ScoreMeterProps {
  /** Raw cosine similarity, shown as the numeric readout. */
  value: number
  /** Bar fill from 0 to 1. Cosine spreads are narrow, so this is usually rescaled. */
  intensity: number
  /** Bar colour; defaults to the foreground ink. */
  color?: string
  hideValue?: boolean
  className?: string
}

export function ScoreMeter({
  value,
  intensity,
  color,
  hideValue,
  className,
}: ScoreMeterProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
          style={{
            width: `${Math.max(2, intensity * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {!hideValue && (
        <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
          {formatScore(value)}
        </span>
      )}
    </div>
  )
}
