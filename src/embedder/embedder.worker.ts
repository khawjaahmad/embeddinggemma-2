/// <reference lib="webworker" />

/**
 * Owns the EmbeddingGemma 2 session. Everything here runs off the main thread so
 * that a 700ms GPU pass never blocks typing or the webcam preview.
 */

import {
  AutoConfig,
  AutoModel,
  AutoProcessor,
  RawImage,
  RawVideo,
} from "@huggingface/transformers"

import { MODEL_ID, NATIVE_DIM, SAFE_TOKEN_BUDGET } from "@/lib/model-info"
import type {
  DecodedInput,
  EngineInfo,
  LoadOptions,
  PixelFrame,
  WorkerRequest,
  WorkerResponse,
} from "./protocol"

/**
 * A single text is truncated to the whole budget; a batch of them is capped by
 * the same number, since the GPU dispatches batch size x padded length.
 */
const TEXT_TOKEN_LIMIT = SAFE_TOKEN_BUDGET
const TEXT_BATCH_LIMIT = 16

/** Applied to every tokenizer call so no input can exceed the dispatch limit. */
const TOKENIZER_OPTIONS = {
  truncation: true,
  max_length: TEXT_TOKEN_LIMIT,
} as const

/* eslint-disable @typescript-eslint/no-explicit-any */
let model: any = null
let processor: any = null

function respond(message: WorkerResponse, transfer: Transferable[] = []) {
  self.postMessage(message, transfer)
}

function toRawImage(frame: PixelFrame) {
  return new RawImage(frame.data, frame.width, frame.height, 4).rgb()
}

async function load(id: number, options: LoadOptions): Promise<void> {
  await model?.dispose?.()
  model = null
  processor = null

  respond({ id, type: "stage", stage: "Reading model config" })
  const config: any = await AutoConfig.from_pretrained(MODEL_ID)

  // Selective encoder loading: dropping a config skips that encoder's download
  // entirely, which is what keeps a text-only session at 175 MB instead of 473 MB.
  if (!options.encoders.vision) config.vision_config = null
  if (!options.encoders.audio) config.audio_config = null

  respond({ id, type: "stage", stage: "Loading tokenizer and processor" })
  processor = await AutoProcessor.from_pretrained(MODEL_ID)

  respond({ id, type: "stage", stage: "Fetching weights" })
  model = await AutoModel.from_pretrained(MODEL_ID, {
    config,
    device: options.device,
    dtype: options.dtype,
    progress_callback: (event: any) => {
      if (event.status !== "progress") return
      respond({
        id,
        type: "download",
        progress: {
          file: event.file,
          loaded: event.loaded ?? 0,
          total: event.total ?? 0,
        },
      })
    },
  })

  respond({ id, type: "stage", stage: "Warming up the GPU" })
  await runModel(await processor(["task: search result | query: warmup"]))

  const info: EngineInfo = { ...options, dim: NATIVE_DIM }
  respond({ id, type: "loaded", info })
}

/** Runs one prepared batch and splits the pooled output into per-item vectors. */
async function runModel(encoded: any): Promise<Float32Array[]> {
  const { sentence_embedding } = await model(encoded)
  const [batchSize, dim] = sentence_embedding.dims
  const data = sentence_embedding.data as Float32Array
  return Array.from({ length: batchSize }, (_, row) =>
    data.slice(row * dim, (row + 1) * dim)
  )
}

async function prepareMedia(input: DecodedInput) {
  if (input.kind === "image") {
    return processor(null, toRawImage(input.frame))
  }
  if (input.kind === "audio") {
    return processor(null, null, input.samples)
  }
  if (input.kind === "video") {
    const frames = input.frames.map(toRawImage)
    return processor(null, null, null, new RawVideo(frames, input.durationSec))
  }
  throw new Error(`Cannot prepare media for "${input.kind}"`)
}

/**
 * True token counts from the tokenizer. A character heuristic is not good enough
 * here: CJK and dense code run well under three characters per token, which would
 * silently overshoot the dispatch limit.
 */
function countTokens(texts: string[]): number[] {
  const { attention_mask } = processor.tokenizer(texts, {
    padding: true,
    ...TOKENIZER_OPTIONS,
  })
  const [rows, width] = attention_mask.dims
  const mask = attention_mask.data as ArrayLike<number | bigint>

  return Array.from({ length: rows }, (_, row) => {
    let used = 0
    for (let column = 0; column < width; column++)
      used += Number(mask[row * width + column])
    return used
  })
}

/**
 * Groups text by padded batch cost (batch size x longest sequence), since that
 * is what the GPU actually dispatches.
 */
function* textBatches(
  indices: number[],
  tokens: number[]
): Generator<number[]> {
  let batch: number[] = []
  let longest = 0

  for (const [position, index] of indices.entries()) {
    const cost = tokens[position]
    const nextLongest = Math.max(longest, cost)
    const overBudget = (batch.length + 1) * nextLongest > TEXT_TOKEN_LIMIT

    if (batch.length > 0 && (overBudget || batch.length >= TEXT_BATCH_LIMIT)) {
      yield batch
      batch = []
      longest = 0
    }

    batch.push(index)
    longest = Math.max(longest, cost)
  }

  if (batch.length > 0) yield batch
}

async function embed(id: number, inputs: DecodedInput[]): Promise<void> {
  if (!model) throw new Error("The model is not loaded yet")

  const startedAt = performance.now()
  const vectors = new Array<Float32Array>(inputs.length)

  const textIndices: number[] = []
  const mediaIndices: number[] = []
  for (const [index, input] of inputs.entries()) {
    if (input.kind === "text") textIndices.push(index)
    else mediaIndices.push(index)
  }

  const textOf = (index: number) => (inputs[index] as { text: string }).text

  if (textIndices.length > 0) {
    const tokens = countTokens(textIndices.map(textOf))
    for (const batch of textBatches(textIndices, tokens)) {
      const rows = await runModel(
        await processor(batch.map(textOf), null, null, null, TOKENIZER_OPTIONS)
      )
      batch.forEach((index, row) => (vectors[index] = rows[row]))
    }
  }

  // Media goes one item at a time: a single image already costs 280 tokens and a
  // sampled video costs 140 per frame.
  for (const index of mediaIndices) {
    const [vector] = await runModel(await prepareMedia(inputs[index]))
    vectors[index] = vector
  }

  respond(
    { id, type: "embedded", vectors, elapsedMs: performance.now() - startedAt },
    vectors.map((vector) => vector.buffer as ArrayBuffer)
  )
}

async function handle(request: WorkerRequest): Promise<void> {
  try {
    if (request.type === "load") await load(request.id, request.options)
    else await embed(request.id, request.inputs)
  } catch (error) {
    respond({
      id: request.id,
      type: "failed",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

// One session, one GPU queue: requests are serialized rather than interleaved.
let pending: Promise<void> = Promise.resolve()

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  pending = pending.then(() => handle(event.data))
}
