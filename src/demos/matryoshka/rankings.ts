import type { CorpusItem } from "@/corpus/corpus"
import { scoreCorpus } from "@/corpus/ranking"
import { MRL_DIMS, NATIVE_DIM, type MrlDim } from "@/lib/model-info"
import { topKOverlap } from "@/lib/vector"

export const TOP_K = 5

/** Full ranking at every Matryoshka size, so a chart can show where an item fell to, not just the top K. */
export type Rankings = Map<MrlDim, CorpusItem[]>

export function rankAtEveryDim(
  items: CorpusItem[],
  vectors: Map<string, Float32Array>,
  query: Float32Array
): Rankings {
  return new Map(
    MRL_DIMS.map((dim) => [
      dim,
      scoreCorpus(items, vectors, query, dim).map((entry) => entry.item),
    ])
  )
}

/** How many of the native ranking's top K survive at `dim`. */
export function keptAt(rankings: Rankings, dim: MrlDim): number {
  const reference = (rankings.get(NATIVE_DIM) ?? []).map((item) => item.id)
  const ranked = (rankings.get(dim) ?? []).map((item) => item.id)
  return reference.length > 0 ? topKOverlap(reference, ranked, TOP_K) : 0
}

/** Lanes are ranks 1..TOP_K plus one bottom lane for items that fell below the cut. */
const LANES = TOP_K + 1
export const COLUMN_WIDTH = 100 / MRL_DIMS.length
export const LANE_HEIGHT = 100 / LANES

export interface Point {
  x: number
  y: number
}

/** Position in a 100×100 box; anything below the cut collapses onto that column's bottom lane. */
export function flowPoint(column: number, rank: number): Point {
  return {
    x: (column + 0.5) * COLUMN_WIDTH,
    y: (Math.min(rank, TOP_K) + 0.5) * LANE_HEIGHT,
  }
}

interface FlowNode {
  item: CorpusItem
  /** Rank at each size, in MRL_DIMS order. */
  ranks: number[]
}

interface FlowSegment {
  key: string
  item: CorpusItem
  from: Point
  to: Point
}

/**
 * Bump-chart geometry: one node per item per size, and a segment between
 * neighbouring sizes unless the item is below the cut at both ends.
 */
export function rankFlowLayout(rankings: Rankings) {
  const tracked = new Map<string, CorpusItem>()
  for (const ranked of rankings.values())
    for (const item of ranked.slice(0, TOP_K)) tracked.set(item.id, item)

  const nodes: FlowNode[] = [...tracked.values()].map((item) => ({
    item,
    ranks: MRL_DIMS.map((dim) =>
      rankings.get(dim)!.findIndex((entry) => entry.id === item.id)
    ),
  }))

  const segments: FlowSegment[] = nodes.flatMap(({ item, ranks }) =>
    ranks.slice(1).flatMap((rank, index) => {
      const previous = ranks[index]
      if (previous >= TOP_K && rank >= TOP_K) return []
      return [
        {
          key: `${item.id}-${index}`,
          item,
          from: flowPoint(index, previous),
          to: flowPoint(index + 1, rank),
        },
      ]
    })
  )

  const dropped = MRL_DIMS.map(
    (_, column) => nodes.filter(({ ranks }) => ranks[column] >= TOP_K).length
  )

  return { nodes, segments, dropped }
}
