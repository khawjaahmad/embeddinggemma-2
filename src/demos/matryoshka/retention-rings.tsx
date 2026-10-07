import { ProgressRing } from "@/components/viz/progress-ring"
import { MRL_DIMS, type MrlDim } from "@/lib/model-info"
import { keptAt, TOP_K, type Rankings } from "./rankings"

export function RetentionRings({
  rankings,
  active,
}: {
  rankings: Rankings
  active: MrlDim
}) {
  return (
    <div className="grid h-full grid-cols-2 place-items-center gap-4">
      {MRL_DIMS.map((dim) => {
        const kept = keptAt(rankings, dim)
        return (
          <div
            key={dim}
            className="relative flex size-24 items-center justify-center"
          >
            <ProgressRing
              value={kept / TOP_K}
              thickness={7}
              color={
                dim === active ? "var(--foreground)" : "var(--muted-foreground)"
              }
              className="absolute inset-0"
            />
            <span className="flex flex-col items-center leading-none">
              <span className="font-mono text-lg tabular-nums">
                {kept}
                <span className="text-muted-foreground">/{TOP_K}</span>
              </span>
              <span className="mt-1 font-mono text-[10px] text-muted-foreground">
                {dim}d
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
