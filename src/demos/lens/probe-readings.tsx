import { cn } from "cn"

import { ScoreMeter } from "@/components/viz/score-meter"
import { PROBE_COLORS, type FrameReading } from "./probes"

interface ProbeReadingsProps {
  probes: string[]
  reading: FrameReading | undefined
  leader: number
}

/** The probe list doubles as the legend for the radar and timeline: number, colour, text. */
export function ProbeReadings({ probes, reading, leader }: ProbeReadingsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {probes.map((prompt, index) => (
        <div key={`${index}-${prompt}`} className="flex flex-col gap-1">
          <span
            className={cn(
              "flex items-center gap-2 truncate text-xs",
              index === leader ? "font-medium" : "text-muted-foreground"
            )}
          >
            <span className="w-3 font-mono text-[10px] text-muted-foreground">
              {index + 1}
            </span>
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: PROBE_COLORS[index] }}
            />
            <span className="truncate">{prompt}</span>
          </span>
          <ScoreMeter
            value={reading?.scores[index] ?? 0}
            intensity={reading?.weights[index] ?? 0}
            color={PROBE_COLORS[index]}
            hideValue={!reading}
            className={cn(!reading && "opacity-30")}
          />
        </div>
      ))}
    </div>
  )
}
