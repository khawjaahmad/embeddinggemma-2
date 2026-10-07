import { cn } from "cn"

import { MODALITY_COLORS, ModalityMark } from "@/components/modality"
import { ScoreMeter } from "@/components/viz/score-meter"
import { formatScore } from "@/lib/format"
import { CorpusItemDialog, CorpusThumb } from "./corpus-preview"
import type { RankedItem } from "./ranking"

interface ResultTileProps {
  entry: RankedItem
  position: number
  highlight?: boolean
  showScore?: boolean
}

/** A ranked corpus item as a square thumbnail with rank, modality and score; opens a preview. */
export function ResultTile({
  entry,
  position,
  highlight,
  showScore,
}: ResultTileProps) {
  const { item, score, intensity } = entry

  return (
    <CorpusItemDialog item={item}>
      <button
        type="button"
        aria-label={`${position + 1}. ${item.title}, score ${formatScore(score)}`}
        className={cn(
          "group relative flex animate-in flex-col overflow-hidden border bg-card text-left outline-none fade-in focus-visible:ring-2 focus-visible:ring-ring",
          highlight && "border-foreground/40"
        )}
      >
        <CorpusThumb
          item={item}
          className="aspect-square h-auto w-full transition-transform group-hover:scale-105"
        />
        <span className="absolute top-1 left-1 bg-background/80 px-1 font-mono text-[10px] tabular-nums backdrop-blur">
          {position + 1}
        </span>
        <ModalityMark
          modality={item.modality}
          className="absolute top-1 right-1 size-3 drop-shadow"
        />
        <span className="flex flex-col gap-1 p-1.5">
          <span className="truncate text-[11px]">{item.title}</span>
          <ScoreMeter
            value={score}
            intensity={intensity}
            color={MODALITY_COLORS[item.modality]}
            hideValue={!showScore}
          />
        </span>
      </button>
    </CorpusItemDialog>
  )
}
