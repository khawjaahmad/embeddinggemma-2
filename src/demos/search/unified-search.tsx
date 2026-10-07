import { useMemo, useState } from "react"
import {
  AudioWaveformIcon,
  ChartColumnIcon,
  CrownIcon,
  LayoutGridIcon,
  SearchIcon,
  TrophyIcon,
} from "lucide-react"

import { ExampleChips } from "@/components/example-chips"
import { Cell, CellGrid } from "@/components/layout/cell"
import { ModalityLegend } from "@/components/modality"
import { VectorStrip } from "@/components/viz/vector-strip"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia } from "@/components/ui/empty"
import { MODALITY_ORDER } from "@/corpus/corpus"
import { useCorpusIndex } from "@/corpus/corpus-index"
import { scoreCorpus, withIntensity } from "@/corpus/ranking"
import { ResultTile } from "@/corpus/result-tile"
import { useQueryEmbedding } from "@/embedder/use-query-embedding"
import { formatDuration } from "@/lib/format"
import { TASK_PRESETS, type MrlDim, type TaskPreset } from "@/lib/model-info"
import { BestPerModality } from "./best-per-modality"
import { ScoreSpectrum } from "./score-spectrum"
import { SearchBar } from "./search-bar"
import { TopMatch } from "./top-match"

const COLLAPSED_TILES = 12

const EXAMPLES = [
  "a turtle swimming in the ocean",
  "cats sleeping on a couch",
  "a president's speech",
  "somewhere peaceful",
  "an amount of money",
  "an animal making a noise",
  "sorting numbers",
]

export function UnifiedSearch({ dim }: { dim: MrlDim }) {
  const { items, vectors } = useCorpusIndex()
  const [query, setQuery] = useState(EXAMPLES[0])
  const [task, setTask] = useState<TaskPreset>(TASK_PRESETS[0])
  const [expanded, setExpanded] = useState(false)

  const { vector, elapsedMs, busy } = useQueryEmbedding(query, task)

  const ranked = useMemo(
    () =>
      vector ? withIntensity(scoreCorpus(items, vectors, vector, dim)) : [],
    [vector, items, vectors, dim]
  )
  const presentModalities = MODALITY_ORDER.filter((modality) =>
    items.some((item) => item.modality === modality)
  )
  const visible = expanded ? ranked : ranked.slice(0, COLLAPSED_TILES)

  return (
    <CellGrid>
      <Cell contentClassName="flex flex-col gap-3">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          task={task}
          onTaskChange={setTask}
          busy={busy}
        />
        <ExampleChips examples={EXAMPLES} active={query} onSelect={setQuery} />
      </Cell>

      <Cell
        className="lg:col-span-8"
        title="Ranking"
        icon={LayoutGridIcon}
        action={
          ranked.length > COLLAPSED_TILES && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? `Top ${COLLAPSED_TILES}` : `All ${ranked.length}`}
            </Button>
          )
        }
      >
        {ranked.length === 0 ? (
          <Empty className="h-full min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
            {visible.map((entry, position) => (
              <ResultTile
                key={entry.item.id}
                entry={entry}
                position={position}
                highlight={position === 0}
              />
            ))}
          </div>
        )}
      </Cell>

      <Cell className="lg:col-span-4" title="Top match" icon={CrownIcon}>
        <TopMatch entry={ranked[0]} />
      </Cell>

      <Cell
        className="lg:col-span-8"
        title="Score spectrum"
        icon={ChartColumnIcon}
        action={<ModalityLegend modalities={presentModalities} />}
      >
        <ScoreSpectrum ranked={ranked} />
      </Cell>

      <Cell
        className="lg:col-span-4"
        title="Best per modality"
        icon={TrophyIcon}
      >
        <BestPerModality ranked={ranked} />
      </Cell>

      <Cell
        title="Query vector"
        icon={AudioWaveformIcon}
        action={
          vector && (
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {dim}d · {formatDuration(elapsedMs)}
            </span>
          )
        }
      >
        <VectorStrip vector={vector} dim={dim} />
      </Cell>
    </CellGrid>
  )
}
