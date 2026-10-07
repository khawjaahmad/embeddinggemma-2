import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { TRUNCATION_BENCHMARKS } from "@/lib/model-info"
import { SERIES_COLORS } from "@/lib/palette"

const CONFIG = {
  mtebMultilingual: { label: "MTEB", color: SERIES_COLORS[4] },
  mtebCode: { label: "Code", color: SERIES_COLORS[5] },
  mieb: { label: "MIEB", color: SERIES_COLORS[6] },
  mmeb: { label: "MMEB", color: SERIES_COLORS[7] },
} satisfies ChartConfig

/** Model-card scores at each size, left to right in the same order as the rank flow. */
export function BenchmarkChart() {
  return (
    <ChartContainer config={CONFIG} className="aspect-auto h-60 w-full">
      <LineChart
        data={TRUNCATION_BENCHMARKS}
        margin={{ left: 4, right: 12, top: 8 }}
      >
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="4 4"
        />
        <XAxis
          dataKey="dim"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          domain={[40, 85]}
          tickLine={false}
          axisLine={false}
          width={28}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
          content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {Object.keys(CONFIG).map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="linear"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: `var(--color-${key})` }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
