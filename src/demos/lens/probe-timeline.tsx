import { Area, AreaChart, XAxis, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { PROBE_COLORS, type FrameReading } from "./probes"

/** Each probe's softmax share over the recent frames, stacked to 100%. */
export function ProbeTimeline({
  readings,
  count,
}: {
  readings: FrameReading[]
  count: number
}) {
  const keys = Array.from({ length: count }, (_, index) => `p${index}`)
  const config = Object.fromEntries(
    keys.map((key, index) => [
      key,
      { label: `${index + 1}`, color: PROBE_COLORS[index] },
    ])
  ) satisfies ChartConfig
  const data = readings.map((reading, frame) =>
    Object.fromEntries([
      ["frame", frame],
      ...reading.weights.map((weight, index) => [keys[index], weight]),
    ])
  )

  if (data.length < 2) return <div className="h-48 bg-dots" />

  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full">
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis dataKey="frame" hide />
        <YAxis domain={[0, 1]} hide />
        {keys.map((key, index) => (
          <Area
            key={key}
            dataKey={key}
            stackId="share"
            type="monotone"
            stroke={PROBE_COLORS[index]}
            strokeWidth={1}
            fill={PROBE_COLORS[index]}
            fillOpacity={0.55}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}
