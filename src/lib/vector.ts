/**
 * Vector helpers for EmbeddingGemma 2 embeddings.
 *
 * The model returns L2-normalized 768d vectors, so cosine similarity is just a
 * dot product. Truncating a unit vector does not preserve unit length, which is
 * why every Matryoshka slice is re-normalized here.
 */

import type { MrlDim } from "./model-info"

export type Embedding = Float32Array

function l2Normalize(vector: Embedding): Embedding {
  let sumOfSquares = 0
  for (const value of vector) sumOfSquares += value * value

  const norm = Math.sqrt(sumOfSquares)
  if (norm === 0) return vector

  const out = new Float32Array(vector.length)
  for (let i = 0; i < vector.length; i++) out[i] = vector[i] / norm
  return out
}

/** Keep the leading `dim` dimensions and re-normalize, per the MRL guidance. */
export function truncate(vector: Embedding, dim: MrlDim): Embedding {
  if (dim >= vector.length) return vector
  return l2Normalize(vector.subarray(0, dim))
}

/** Cosine similarity. Both inputs must already be normalized and same length. */
export function similarity(a: Embedding, b: Embedding): number {
  let total = 0
  for (let i = 0; i < a.length; i++) total += a[i] * b[i]
  return total
}

export interface WeightedVector {
  vector: Embedding
  weight: number
}

/** Weighted sum of vectors, re-normalized — the basis of embedding arithmetic. */
export function combine(terms: WeightedVector[]): Embedding | null {
  const first = terms.find((term) => term.weight !== 0)
  if (!first) return null

  const out = new Float32Array(first.vector.length)
  for (const { vector, weight } of terms) {
    if (weight === 0) continue
    for (let i = 0; i < out.length; i++) out[i] += vector[i] * weight
  }
  return l2Normalize(out)
}

export function softmax(scores: number[], temperature = 0.05): number[] {
  if (scores.length === 0) return []

  const max = Math.max(...scores)
  const exponentials = scores.map((score) =>
    Math.exp((score - max) / temperature)
  )
  const total = exponentials.reduce((sum, value) => sum + value, 0)
  return exponentials.map((value) => value / total)
}

/** Rescale a set of scores to 0..1 so small cosine spreads stay readable. */
export function relativeScale(scores: number[]): number[] {
  if (scores.length === 0) return []

  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const spread = max - min
  if (spread < 1e-6) return scores.map(() => 1)
  return scores.map((score) => (score - min) / spread)
}

/**
 * How many of the top `k` items survive between two rankings. Used to show that
 * Matryoshka truncation preserves ordering, not just scores.
 */
export function topKOverlap(a: string[], b: string[], k: number): number {
  const reference = new Set(a.slice(0, k))
  return b.slice(0, k).filter((id) => reference.has(id)).length
}

/** Bytes needed to store `count` vectors of `dim` float32 values. */
export function storageBytes(count: number, dim: number): number {
  return count * dim * 4
}
