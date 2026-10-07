import { CheckIcon } from "lucide-react"

import { ProgressRing } from "@/components/viz/progress-ring"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCorpusIndex } from "@/corpus/corpus-index"
import { formatDuration } from "@/lib/format"

/** Progress ring while indexing, item count once done; the label lives in the tooltip. */
export function IndexStatus() {
  const { status, progress, items, elapsedMs } = useCorpusIndex()
  if (status !== "indexing" && status !== "ready") return null

  const indexing = status === "indexing"
  const fraction = progress.total > 0 ? progress.done / progress.total : 0

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
            <ProgressRing value={indexing ? fraction : 1} className="size-5" />
            {indexing ? `${progress.done}/${progress.total}` : items.length}
            {!indexing && <CheckIcon className="size-3" />}
          </span>
        }
      />
      <TooltipContent>
        {indexing
          ? (progress.label ?? "Indexing")
          : `Indexed in ${formatDuration(elapsedMs)}`}
      </TooltipContent>
    </Tooltip>
  )
}
