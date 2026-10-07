import type { MrlDim } from "@/lib/model-info"
import { SERIES_COLORS } from "@/lib/palette"
import { similarity, softmax, truncate } from "@/lib/vector"

export const DEFAULT_PROBES = [
  "a person holding up their hand",
  "a laptop or computer screen",
  "a coffee mug or drink",
  "an empty room with no one in it",
  "a phone being held up to the camera",
  "a book or sheet of paper",
]

/** One fixed hue per probe line; probes past the palette length are ignored rather than recoloured. */
export const PROBE_COLORS = SERIES_COLORS
const MAX_PROBES = PROBE_COLORS.length

const SOFTMAX_TEMPERATURE = 0.03

export function parseProbes(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_PROBES)
}

export interface FrameReading {
  /** Raw cosine similarity of the frame to each probe. */
  scores: number[]
  /** Softmax share of each probe, summing to 1 across probes. */
  weights: number[]
}

/** Scores every frame in the window against every probe at `dim`; the last entry is "now". */
export function readFrames(
  frames: Float32Array[],
  probeVectors: Float32Array[],
  dim: MrlDim
): FrameReading[] {
  const probes = probeVectors.map((probe) => truncate(probe, dim))

  return frames.map((frameVector) => {
    const frame = truncate(frameVector, dim)
    const scores = probes.map((probe) => similarity(frame, probe))
    return { scores, weights: softmax(scores, SOFTMAX_TEMPERATURE) }
  })
}
