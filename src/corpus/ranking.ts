/**
 * Ranking the corpus against a probe vector. Pure functions, so every demo
 * ranks the same way and the views only decide how to draw the result.
 */

import type { MrlDim } from "@/lib/model-info"
import { relativeScale, similarity, truncate } from "@/lib/vector"
import type { CorpusItem } from "./corpus"

export interface ScoredItem {
  item: CorpusItem
  /** The item's vector at the ranked dimension, kept for follow-up comparisons. */
  vector: Float32Array
  score: number
}

export interface RankedItem extends ScoredItem {
  /** Score rescaled to 0..1 within this ranking, for bar fills. */
  intensity: number
}

/** Every indexed item, best first, compared at `dim` with both sides re-normalized. */
export function scoreCorpus(
  items: CorpusItem[],
  vectors: Map<string, Float32Array>,
  probe: Float32Array,
  dim: MrlDim
): ScoredItem[] {
  const query = truncate(probe, dim)

  return items
    .filter((item) => vectors.has(item.id))
    .map((item) => {
      const vector = truncate(vectors.get(item.id)!, dim)
      return { item, vector, score: similarity(query, vector) }
    })
    .sort((a, b) => b.score - a.score)
}

export function withIntensity(scored: ScoredItem[]): RankedItem[] {
  const intensities = relativeScale(scored.map((entry) => entry.score))
  return scored.map((entry, index) => ({
    ...entry,
    intensity: intensities[index],
  }))
}
