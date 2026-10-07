import { cn } from "cn"

import { MODALITY_COLORS } from "@/components/modality"
import { Skeleton } from "@/components/ui/skeleton"
import { CorpusThumb } from "@/corpus/corpus-preview"
import { MRL_DIMS, NATIVE_DIM, type MrlDim } from "@/lib/model-info"
import {
  COLUMN_WIDTH,
  flowPoint,
  LANE_HEIGHT,
  rankFlowLayout,
  TOP_K,
  type Rankings,
} from "./rankings"

/** Bump chart: how the top K reshuffles as the vector is cut from 768 down to 128. */
export function RankFlow({
  rankings,
  active,
}: {
  rankings: Rankings
  active: MrlDim
}) {
  if (!rankings.has(NATIVE_DIM))
    return <Skeleton className="h-80 rounded-none" />

  const { nodes, segments, dropped } = rankFlowLayout(rankings)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 text-center font-mono text-xs">
        {MRL_DIMS.map((dim) => (
          <span
            key={dim}
            className={cn(
              dim === active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {dim}d
          </span>
        ))}
      </div>

      <div className="relative h-80">
        {/* Lane for the active size, and the "fell out" lane at the bottom. */}
        <div
          className="absolute inset-y-0 bg-muted/40"
          style={{
            left: `${MRL_DIMS.indexOf(active) * COLUMN_WIDTH}%`,
            width: `${COLUMN_WIDTH}%`,
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 bg-dots"
          style={{ height: `${LANE_HEIGHT}%` }}
        />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          aria-hidden
        >
          {segments.map(({ key, item, from, to }) => (
            <line
              key={key}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={MODALITY_COLORS[item.modality]}
              strokeOpacity={0.7}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {nodes.flatMap(({ item, ranks }) =>
          ranks.flatMap((rank, column) => {
            if (rank >= TOP_K) return []
            const { x, y } = flowPoint(column, rank)
            return (
              <div
                key={`${item.id}-${column}`}
                title={`${item.title} · #${rank + 1} at ${MRL_DIMS[column]}d`}
                className="absolute -translate-1/2 transition-[top] duration-500 ease-out"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <CorpusThumb
                  item={item}
                  className="size-9 ring-2 ring-background"
                />
              </div>
            )
          })
        )}

        {dropped.map((count, column) => {
          if (count === 0) return null
          const { x, y } = flowPoint(column, TOP_K)
          return (
            <span
              key={column}
              title={`${count} dropped out of the top ${TOP_K}`}
              className="absolute -translate-1/2 border bg-background px-1.5 font-mono text-[10px] text-muted-foreground tabular-nums"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              −{count}
            </span>
          )
        })}
      </div>
    </div>
  )
}
