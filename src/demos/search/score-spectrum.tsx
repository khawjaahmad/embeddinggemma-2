import { Bar, BarChart, Cell as BarCell, XAxis, YAxis } from "recharts"

import { MODALITY_COLORS, ModalityMark } from "@/components/modality"
import { ChartTip } from "@/components/viz/chart-tip"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import type { RankedItem } from "@/corpus/ranking"
import { formatScore } from "@/lib/format"

const CONFIG = { score: { label: "Score" } } satisfies ChartConfig

/** Snaps an axis bound outward to the nearest 0.02 so the bars keep some headroom. */
const snap = (value: number, round: (x: number) => number) =>
  round(value * 50) / 50

/** Every item's score as one bar, best first, coloured by modality. */
export function ScoreSpectrum({ ranked }: { ranked: RankedItem[] }) {
  const data = ranked.map(({ item, score }) => ({
    id: item.id,
    title: item.title,
    modality: item.modality,
    score,
  }))
  const scores = data.map((entry) => entry.score)
  const floor =
    scores.length > 0 ? snap(Math.min(...scores) - 0.02, Math.floor) : 0
  const ceiling =
    scores.length > 0 ? snap(Math.max(...scores) + 0.02, Math.ceil) : 1

  return (
    <ChartContainer config={CONFIG} className="aspect-auto h-52 w-full">
      <BarChart
        data={data}
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        barCategoryGap={2}
      >
        <XAxis dataKey="id" hide />
        <YAxis
          domain={[floor, ceiling]}
          tickLine={false}
          axisLine={false}
          width={36}
          tickCount={4}
          tickFormatter={(value: number) => value.toFixed(2)}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as
              (typeof data)[number] | undefined
            if (!active || !point) return null
            return (
              <ChartTip>
                <span className="flex items-center gap-1.5 font-medium">
                  <ModalityMark modality={point.modality} className="size-3" />
                  {point.title}
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  {formatScore(point.score)}
                </span>
              </ChartTip>
            )
          }}
        />
        <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((entry) => (
            <BarCell key={entry.id} fill={MODALITY_COLORS[entry.modality]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
