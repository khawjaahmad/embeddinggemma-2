import { cn } from "cn"

interface ProgressRingProps {
  /** Fill from 0 to 1. */
  value: number
  /** Stroke width in viewBox units, where the ring is 100 across. */
  thickness?: number
  color?: string
  className?: string
}

export function ProgressRing({
  value,
  thickness = 10,
  color = "var(--foreground)",
  className,
}: ProgressRingProps) {
  const radius = 50 - thickness / 2
  const length = 2 * Math.PI * radius
  const fill = Math.min(1, Math.max(0, value))

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("-rotate-90", className)}
      aria-hidden
    >
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={thickness}
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - fill)}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}
