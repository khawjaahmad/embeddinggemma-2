import { MODALITY_COLORS, MODALITY_LABELS } from "@/components/modality"
import { ScoreMeter } from "@/components/viz/score-meter"
import { MODALITY_ORDER } from "@/corpus/corpus"
import { CorpusThumb } from "@/corpus/corpus-preview"
import type { RankedItem } from "@/corpus/ranking"

/** The highest-ranked item of each modality, with where it placed overall. */
export function BestPerModality({ ranked }: { ranked: RankedItem[] }) {
  const best = MODALITY_ORDER.flatMap((modality) => {
    const position = ranked.findIndex(
      (entry) => entry.item.modality === modality
    )
    return position === -1
      ? []
      : [{ modality, position, entry: ranked[position] }]
  })

  if (best.length === 0) return <div className="h-40 animate-pulse bg-muted" />

  return (
    <div className="flex flex-col gap-4">
      {best.map(({ modality, position, entry }) => (
        <div key={modality} className="flex items-center gap-3">
          <CorpusThumb item={entry.item} className="size-9" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">
                {MODALITY_LABELS[modality]}
              </span>
              <span className="truncate">{entry.item.title}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
                #{position + 1}
              </span>
            </span>
            <ScoreMeter
              value={entry.score}
              intensity={entry.intensity}
              color={MODALITY_COLORS[modality]}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
