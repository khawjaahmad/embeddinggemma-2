import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { relativeScale } from "@/lib/vector"

const CONFIG = { strength: { label: "Match" } } satisfies ChartConfig

/** One spoke per probe, numbered to match the probe list. */
export function ProbeRadar({
  scores,
  count,
}: {
  scores: number[]
  count: number
}) {
  // Cosine spreads are narrow, so the shape uses the relative scale rather than raw scores.
  const strengths = relativeScale(scores)
  const data = Array.from({ length: count }, (_, index) => ({
    probe: String(index + 1),
    strength: strengths[index] ?? 0,
  }))

  return (
    <ChartContainer config={CONFIG} className="mx-auto aspect-square h-52">
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="probe"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <Radar
          dataKey="strength"
          stroke="var(--foreground)"
          strokeWidth={1.5}
          fill="var(--foreground)"
          fillOpacity={0.12}
          isAnimationActive={false}
        />
      </RadarChart>
    </ChartContainer>
  )
}
