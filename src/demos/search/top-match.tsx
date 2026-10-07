import { ModalityMark } from "@/components/modality"
import { CorpusPreview, CorpusThumb } from "@/corpus/corpus-preview"
import type { RankedItem } from "@/corpus/ranking"
import { formatScore } from "@/lib/format"

/** The best result, playable in place, with its score as the headline number. */
export function TopMatch({ entry }: { entry: RankedItem | undefined }) {
  if (!entry) return <div className="aspect-video animate-pulse bg-muted" />

  const { item, score } = entry

  return (
    <div className="flex flex-col gap-3">
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-card">
        {item.modality === "audio" ? (
          <div className="flex w-full flex-col items-center gap-4 p-4">
            <CorpusThumb item={item} className="size-16" />
            <CorpusPreview item={item} />
          </div>
        ) : item.modality === "text" ? (
          <div className="size-full overflow-hidden">
            <CorpusPreview item={item} />
          </div>
        ) : (
          <CorpusPreview key={item.id} item={item} />
        )}
      </div>
      <div className="flex items-center gap-2">
        <ModalityMark modality={item.modality} />
        <span className="truncate text-sm font-medium">{item.title}</span>
        <span className="ml-auto font-mono text-2xl tracking-tight tabular-nums">
          {formatScore(score)}
        </span>
      </div>
    </div>
  )
}
