import { MODALITY_COLORS, ModalityMark } from "@/components/modality"
import { countByModality, MODALITY_ORDER } from "./corpus"
import { useCorpusIndex } from "./corpus-index"

/** Stacked bar of the corpus by modality, with icon + count legend under it. */
export function CorpusMix() {
  const { items, vectors } = useCorpusIndex()
  const counts = countByModality(items)
  const present = MODALITY_ORDER.filter((modality) => counts[modality] > 0)
  const indexed = items.length > 0 ? vectors.size / items.length : 0

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-1.5 gap-0.5 overflow-hidden"
        style={{ opacity: 0.35 + 0.65 * indexed }}
      >
        {present.map((modality) => (
          <div
            key={modality}
            className="h-full rounded-[2px]"
            style={{
              flexGrow: counts[modality],
              backgroundColor: MODALITY_COLORS[modality],
            }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {present.map((modality) => (
          <span
            key={modality}
            className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground tabular-nums"
          >
            <ModalityMark modality={modality} className="size-3" />
            {counts[modality]}
          </span>
        ))}
      </div>
    </div>
  )
}
