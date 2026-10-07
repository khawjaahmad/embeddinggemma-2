/**
 * Message contract between the UI and the embedding worker.
 *
 * Media is decoded on the main thread because `load_video` needs a DOM video
 * element and `load_audio` needs an `AudioContext`, neither of which exists in a
 * worker. The worker therefore receives raw pixels and PCM samples, which also
 * makes every payload transferable.
 */

type Dtype = "q4" | "q4f16" | "q8" | "fp16" | "fp32"
type Device = "webgpu" | "wasm"

/**
 * Precision is set per component; `model` is the text backbone. Declared as a
 * type alias rather than an interface so it keeps the implicit index signature
 * that Transformers.js expects.
 */
type DtypeConfig = {
  model: Dtype
  vision_encoder: Dtype
  audio_encoder: Dtype
}

export interface EncoderSelection {
  vision: boolean
  audio: boolean
}

export interface PixelFrame {
  data: Uint8ClampedArray
  width: number
  height: number
}

export type DecodedInput =
  | { kind: "text"; text: string }
  | { kind: "image"; frame: PixelFrame }
  | { kind: "audio"; samples: Float32Array; durationSec: number }
  | { kind: "video"; frames: PixelFrame[]; durationSec: number }

export interface LoadOptions {
  device: Device
  dtype: DtypeConfig
  encoders: EncoderSelection
}

export interface EngineInfo {
  device: Device
  dtype: DtypeConfig
  encoders: EncoderSelection
  dim: number
}

export interface DownloadProgress {
  file: string
  loaded: number
  total: number
}

export type WorkerRequest =
  | { id: number; type: "load"; options: LoadOptions }
  | { id: number; type: "embed"; inputs: DecodedInput[] }

export type WorkerResponse =
  | { id: number; type: "download"; progress: DownloadProgress }
  | { id: number; type: "stage"; stage: string }
  | { id: number; type: "loaded"; info: EngineInfo }
  | { id: number; type: "embedded"; vectors: Float32Array[]; elapsedMs: number }
  | { id: number; type: "failed"; message: string }

/** Collects every ArrayBuffer in a payload so postMessage can transfer them. */
export function transferablesOf(inputs: DecodedInput[]): Transferable[] {
  return inputs.flatMap((input) => {
    if (input.kind === "image") return [input.frame.data.buffer as ArrayBuffer]
    if (input.kind === "audio") return [input.samples.buffer as ArrayBuffer]
    if (input.kind === "video")
      return input.frames.map((frame) => frame.data.buffer as ArrayBuffer)
    return []
  })
}
