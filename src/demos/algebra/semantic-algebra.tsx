import { useMemo, useState } from "react"
import {
  AudioWaveformIcon,
  EqualIcon,
  Grid3x3Icon,
  LayoutGridIcon,
  SigmaIcon,
} from "lucide-react"

import { ExampleChips } from "@/components/example-chips"
import { Cell, CellGrid } from "@/components/layout/cell"
import { VectorStrip } from "@/components/viz/vector-strip"
import { Skeleton } from "@/components/ui/skeleton"
import { useCorpusIndex } from "@/corpus/corpus-index"
import { CorpusThumb } from "@/corpus/corpus-preview"
import { scoreCorpus, withIntensity } from "@/corpus/ranking"
import { ResultTile } from "@/corpus/result-tile"
import { useTextVectors } from "@/embedder/use-text-vectors"
import type { MrlDim } from "@/lib/model-info"
import { combine, truncate } from "@/lib/vector"
import { AddTermControls } from "./add-term-controls"
import { TermHeatmap } from "./term-heatmap"
import { TermTile } from "./term-tile"
import { createTerm, PRESETS, type Term } from "./terms"

const RESULT_COUNT = 6

export function SemanticAlgebra({ dim }: { dim: MrlDim }) {
  const { items, vectors } = useCorpusIndex()
  const [terms, setTerms] = useState<Term[]>(PRESETS[0].terms)

  const texts = useMemo(
    () => terms.flatMap((term) => (term.text ? [term.text] : [])),
    [terms]
  )
  const textVectors = useTextVectors(texts)

  const termVectors = useMemo(
    () =>
      terms.map((term) => {
        const vector = term.itemId
          ? vectors.get(term.itemId)
          : term.text
            ? textVectors.get(term.text)
            : undefined
        return vector ? truncate(vector, dim) : undefined
      }),
    [terms, vectors, textVectors, dim]
  )

  // The weighted sum only exists once every operand has a vector.
  const composed = useMemo(() => {
    if (terms.length === 0 || termVectors.some((vector) => !vector)) return null
    return combine(
      termVectors.map((vector, index) => ({
        vector: vector!,
        weight: terms[index].sign,
      }))
    )
  }, [terms, termVectors])

  const results = useMemo(() => {
    if (!composed) return []
    // The operands themselves would trivially rank near the top, so they are left out.
    const sources = new Set(
      terms.flatMap((term) => (term.itemId ? [term.itemId] : []))
    )
    const candidates = items.filter((item) => !sources.has(item.id))
    return withIntensity(
      scoreCorpus(candidates, vectors, composed, dim).slice(0, RESULT_COUNT)
    )
  }, [composed, terms, items, vectors, dim])

  const activePreset = PRESETS.find((preset) => preset.terms === terms)?.label

  const updateTerm = (key: string, patch: Partial<Term>) =>
    setTerms((previous) =>
      previous.map((term) => (term.key === key ? { ...term, ...patch } : term))
    )
  const removeTerm = (key: string) =>
    setTerms((previous) => previous.filter((term) => term.key !== key))
  const addTerm = (term: Term) => setTerms((previous) => [...previous, term])

  return (
    <CellGrid>
      <Cell
        title="Equation"
        icon={SigmaIcon}
        contentClassName="flex flex-col gap-4"
      >
        <ExampleChips
          examples={PRESETS.map((preset) => preset.label)}
          active={activePreset}
          onSelect={(label) =>
            setTerms(PRESETS.find((preset) => preset.label === label)!.terms)
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          {terms.map((term, index) => (
            <TermTile
              key={term.key}
              term={term}
              leading={index === 0}
              ready={Boolean(termVectors[index])}
              onToggleSign={() =>
                updateTerm(term.key, { sign: term.sign === 1 ? -1 : 1 })
              }
              onRemove={() => removeTerm(term.key)}
            />
          ))}
          <EqualIcon className="mx-1 size-5 text-muted-foreground" />
          {results[0] ? (
            <CorpusThumb
              item={results[0].item}
              className="size-20 ring-1 ring-foreground/40"
            />
          ) : (
            <Skeleton className="size-20 rounded-none" />
          )}
        </div>

        <AddTermControls
          items={items}
          onAddItem={(itemId) => addTerm(createTerm({ itemId }))}
          onAddText={(text) => addTerm(createTerm({ text }))}
        />
      </Cell>

      <Cell className="lg:col-span-7" title="Nearest" icon={LayoutGridIcon}>
        <div className="grid grid-cols-3 gap-2">
          {results.length === 0
            ? Array.from({ length: RESULT_COUNT }, (_, index) => (
                <Skeleton key={index} className="aspect-square rounded-none" />
              ))
            : results.map((entry, position) => (
                <ResultTile
                  key={entry.item.id}
                  entry={entry}
                  position={position}
                  showScore
                />
              ))}
        </div>
      </Cell>

      <Cell
        className="lg:col-span-5"
        title="Pull of each term"
        icon={Grid3x3Icon}
      >
        <TermHeatmap
          terms={terms}
          termVectors={termVectors}
          results={results}
        />
      </Cell>

      <Cell title="Composed vector" icon={AudioWaveformIcon}>
        <VectorStrip vector={composed} />
      </Cell>
    </CellGrid>
  )
}
