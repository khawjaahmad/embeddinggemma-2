import { Skeleton } from "@/components/ui/skeleton"
import { corpusById, type CorpusItem } from "@/corpus/corpus"
import { CorpusThumb } from "@/corpus/corpus-preview"
import type { ScoredItem } from "@/corpus/ranking"
import { formatScore } from "@/lib/format"
import { similarity } from "@/lib/vector"
import type { Term } from "./terms"

/** Above this share of the range, the cell is light enough to need dark text. */
const LIGHT_CELL = 0.55

interface TermHeatmapProps {
  terms: Term[]
  termVectors: (Float32Array | undefined)[]
  results: ScoredItem[]
}

/** Rows are results, columns are terms; brighter cells mean the result sits closer to that term. */
export function TermHeatmap({ terms, termVectors, results }: TermHeatmapProps) {
  if (results.length === 0) return <Skeleton className="h-56 rounded-none" />

  const grid = results.map((result) =>
    termVectors.map((vector) =>
      vector ? similarity(result.vector, vector) : 0
    )
  )
  const flat = grid.flat()
  const min = Math.min(...flat)
  const spread = Math.max(...flat) - min || 1

  return (
    <div
      className="grid gap-0.5"
      style={{
        gridTemplateColumns: `2.25rem repeat(${terms.length}, minmax(0, 1fr))`,
      }}
    >
      <span />
      {terms.map((term) => {
        const item = term.itemId ? corpusById(term.itemId) : undefined
        return (
          <span
            key={term.key}
            className="flex h-9 items-center justify-center gap-1 font-mono text-[10px] text-muted-foreground"
          >
            {term.sign === 1 ? "+" : "−"}
            {item ? (
              <CorpusThumb item={item} className="size-6" />
            ) : (
              <span className="truncate">{term.text}</span>
            )}
          </span>
        )
      })}

      {results.map((result, row) => (
        <HeatmapRow
          key={result.item.id}
          item={result.item}
          values={grid[row]}
          min={min}
          spread={spread}
        />
      ))}
    </div>
  )
}

function HeatmapRow({
  item,
  values,
  min,
  spread,
}: {
  item: CorpusItem
  values: number[]
  min: number
  spread: number
}) {
  return (
    <>
      <CorpusThumb item={item} className="size-9" />
      {values.map((value, column) => {
        const level = (value - min) / spread
        return (
          <span
            key={column}
            title={`${item.title}: ${formatScore(value)}`}
            className="flex items-center justify-center font-mono text-[10px] tabular-nums"
            style={{
              backgroundColor: `color-mix(in oklab, var(--foreground) ${Math.round(8 + level * 72)}%, transparent)`,
              color:
                level > LIGHT_CELL ? "var(--background)" : "var(--foreground)",
            }}
          >
            {value.toFixed(2)}
          </span>
        )
      })}
    </>
  )
}
