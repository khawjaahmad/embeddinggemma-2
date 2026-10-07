import { cn } from "cn"

import { formatBytes } from "@/lib/format"
import { MRL_DIMS, NATIVE_DIM, type MrlDim } from "@/lib/model-info"
import { storageBytes } from "@/lib/vector"

export const CORPUS_SIZE = 1_000_000

/** Float32 storage for a million vectors at each size. */
export function StorageBars({ active }: { active: MrlDim }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      {MRL_DIMS.map((dim) => (
        <div key={dim} className="flex items-center gap-3">
          <span className="w-10 shrink-0 font-mono text-xs tabular-nums">
            {dim}d
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                dim === active ? "bg-foreground" : "bg-muted-foreground/50"
              )}
              style={{ width: `${(dim / NATIVE_DIM) * 100}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
            {formatBytes(storageBytes(CORPUS_SIZE, dim))}
          </span>
        </div>
      ))}
    </div>
  )
}
