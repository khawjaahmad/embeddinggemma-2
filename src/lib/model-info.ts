/**
 * Facts about EmbeddingGemma 2, taken from the model card of
 * https://huggingface.co/onnx-community/embeddinggemma-2-ONNX
 */

export const MODEL_ID = "onnx-community/embeddinggemma-2-ONNX"
export const MODEL_URL = `https://huggingface.co/${MODEL_ID}`
export const GGUF_URL = "https://huggingface.co/unsloth/embeddinggemma-2-GGUF"
export const BASE_MODEL_URL = "https://huggingface.co/google/embeddinggemma-2"

export const NATIVE_DIM = 768
export const CONTEXT_WINDOW = 8192

export const MRL_DIMS = [768, 512, 256, 128] as const
export type MrlDim = (typeof MRL_DIMS)[number]

export type Modality = "text" | "image" | "audio" | "video"

/**
 * Precision per component. The card recommends q4 on WebGPU, with one exception:
 * audio is "the modality that 4-bit quantization affects the most", so the audio
 * encoder runs at q8. Worst-case cosine to fp32 is 0.975 at q4 (0.988 for text)
 * against 0.9997 at q8.
 */
export const DTYPE = {
  model: "q4",
  vision_encoder: "q4",
  audio_encoder: "q8",
} as const

/** Download size in bytes of each component at the precision above, from the card's dtype table. */
export const COMPONENT_BYTES = {
  text: 175e6,
  vision: 109e6,
  audio: 340e6,
} as const

/** Parameter counts per component, from the model card's "Flexible footprint". */
export const COMPONENT_PARAMS = {
  text: "270M",
  vision: "170M",
  audio: "300M",
} as const

/**
 * Asymmetric task prefixes: a query prefix for the query, `title: X | text: Y`
 * for the corpus. The card's symmetric tasks (classification, clustering,
 * sentence similarity) are deliberately absent — they require the same prefix on
 * both sides and list no document instruction at all, so they do not apply to a
 * retrieval corpus, let alone one whose items are images, audio and video.
 */
export interface TaskPreset {
  id: string
  label: string
  queryPrefix: string
}

export const TASK_PRESETS: TaskPreset[] = [
  {
    id: "search",
    label: "Web / document search",
    queryPrefix: "task: search result | query: ",
  },
  {
    id: "qa",
    label: "Question answering",
    queryPrefix: "task: question answering | query: ",
  },
  {
    id: "fact",
    label: "Fact checking",
    queryPrefix: "task: fact checking | query: ",
  },
  {
    id: "code",
    label: "Code retrieval",
    queryPrefix: "task: code retrieval | query: ",
  },
]

export const DEFAULT_TASK = TASK_PRESETS[0]

export function asQuery(text: string, task: TaskPreset = DEFAULT_TASK) {
  return `${task.queryPrefix}${text}`
}

export function asDocument(text: string, title = "none") {
  return `title: ${title} | text: ${text}`
}

/**
 * Benchmark scores at each Matryoshka dimension, from the model card's
 * "Evaluation Results with Vector Truncation" table.
 */
export interface TruncationBenchmark {
  dim: MrlDim
  compression: string
  mtebMultilingual: number
  mtebCode: number
  mieb: number
  mmeb: number
}

export const TRUNCATION_BENCHMARKS: TruncationBenchmark[] = [
  {
    dim: 768,
    compression: "1:1",
    mtebMultilingual: 61.36,
    mtebCode: 78.68,
    mieb: 64.64,
    mmeb: 59.01,
  },
  {
    dim: 512,
    compression: "1:1.5",
    mtebMultilingual: 61.17,
    mtebCode: 77.24,
    mieb: 64.32,
    mmeb: 58.38,
  },
  {
    dim: 256,
    compression: "1:3",
    mtebMultilingual: 60.41,
    mtebCode: 76.18,
    mieb: 63.13,
    mmeb: 56.24,
  },
  {
    dim: 128,
    compression: "1:6",
    mtebMultilingual: 57.89,
    mtebCode: 71.41,
    mieb: 59.06,
    mmeb: 45.65,
  },
]

/**
 * Below this MMEB score the card calls a size "best suited to text-only
 * workloads" (128d drops multimodal retrieval from 59.0 to 45.7).
 */
export const MULTIMODAL_FLOOR = 50

export function benchmarkFor(dim: MrlDim) {
  return (
    TRUNCATION_BENCHMARKS.find((b) => b.dim === dim) ?? TRUNCATION_BENCHMARKS[0]
  )
}

/** Audio token cost, used to cap clip length under the WebGPU dispatch limit. */
const TOKENS_PER_AUDIO_SECOND = 25

/**
 * The model card's WebGPU guidance: keep each batch under roughly 2,700 tokens,
 * above which some ONNX Runtime WebGPU kernels exceed a GPU dispatch limit.
 */
const WEBGPU_TOKEN_BUDGET = 2700

/** Headroom under the dispatch limit, since the budget above is itself approximate. */
export const SAFE_TOKEN_BUDGET = Math.floor(WEBGPU_TOKEN_BUDGET * 0.75)

/** Longest audio clip that fits the budget, rather than an arbitrary cutoff. */
export const MAX_AUDIO_SECONDS = Math.floor(
  SAFE_TOKEN_BUDGET / TOKENS_PER_AUDIO_SECOND
)
