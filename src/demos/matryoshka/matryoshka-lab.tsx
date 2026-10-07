import { useMemo, useState } from "react"
import {
  AudioWaveformIcon,
  ChartLineIcon,
  CircleDotIcon,
  DatabaseIcon,
  GitCommitVerticalIcon,
  SearchIcon,
} from "lucide-react"
import { cn } from "cn"

import { ExampleChips } from "@/components/example-chips"
import { Cell, CellGrid, Stat } from "@/components/layout/cell"
import { VectorStrip } from "@/components/viz/vector-strip"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useCorpusIndex } from "@/corpus/corpus-index"
import { useQueryEmbedding } from "@/embedder/use-query-embedding"
import { formatBytes } from "@/lib/format"
import {
  benchmarkFor,
  DEFAULT_TASK,
  MULTIMODAL_FLOOR,
  NATIVE_DIM,
  type MrlDim,
} from "@/lib/model-info"
import { storageBytes } from "@/lib/vector"
import { BenchmarkChart } from "./benchmark-chart"
import { RankFlow } from "./rank-flow"
import { rankAtEveryDim, TOP_K, type Rankings } from "./rankings"
import { RetentionRings } from "./retention-rings"
import { CORPUS_SIZE, StorageBars } from "./storage-bars"

const EXAMPLES = [
  "a turtle swimming in the ocean",
  "a quiet place by the water",
  "an amount of money",
  "an animal making a noise",
]

export function MatryoshkaLab({ dim }: { dim: MrlDim }) {
  const { items, vectors } = useCorpusIndex()
  const [query, setQuery] = useState(EXAMPLES[0])
  const { vector } = useQueryEmbedding(query, DEFAULT_TASK, 300)

  const rankings = useMemo<Rankings>(
    () => (vector ? rankAtEveryDim(items, vectors, vector) : new Map()),
    [vector, items, vectors]
  )
  const benchmark = benchmarkFor(dim)

  return (
    <CellGrid>
      <Cell contentClassName="flex flex-col gap-3">
        <InputGroup className="h-10">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Query"
            aria-label="Query"
          />
        </InputGroup>
        <ExampleChips examples={EXAMPLES} active={query} onSelect={setQuery} />
      </Cell>

      <Cell className="col-span-6 sm:col-span-3">
        <Stat value={benchmark.compression} label="compression" />
      </Cell>
      <Cell className="col-span-6 sm:col-span-3">
        <Stat
          value={formatBytes(storageBytes(CORPUS_SIZE, dim))}
          label="per 1M vectors"
        />
      </Cell>
      <Cell className="col-span-6 sm:col-span-3">
        <Stat value={benchmark.mtebMultilingual} label="MTEB" />
      </Cell>
      <Cell className="col-span-6 sm:col-span-3">
        <Stat
          value={
            <span
              className={cn(
                benchmark.mmeb < MULTIMODAL_FLOOR && "text-destructive"
              )}
            >
              {benchmark.mmeb}
            </span>
          }
          label="MMEB"
        />
      </Cell>

      <Cell
        className="lg:col-span-8"
        title="Rank flow"
        icon={GitCommitVerticalIcon}
      >
        <RankFlow rankings={rankings} active={dim} />
      </Cell>

      <Cell
        className="lg:col-span-4"
        title={`Top ${TOP_K} kept`}
        icon={CircleDotIcon}
      >
        <RetentionRings rankings={rankings} active={dim} />
      </Cell>

      <Cell className="lg:col-span-8" title="Benchmarks" icon={ChartLineIcon}>
        <BenchmarkChart />
      </Cell>

      <Cell className="lg:col-span-4" title="Storage · 1M" icon={DatabaseIcon}>
        <StorageBars active={dim} />
      </Cell>

      <Cell
        title="Query vector"
        icon={AudioWaveformIcon}
        action={
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {dim} / {NATIVE_DIM}
          </span>
        }
      >
        <VectorStrip vector={vector} dim={dim} height={64} />
      </Cell>
    </CellGrid>
  )
}
