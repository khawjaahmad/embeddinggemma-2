/**
 * Main-thread media decoding.
 *
 * Decoding happens here rather than in the worker because `load_video` needs a
 * DOM video element and `load_audio` needs an `AudioContext`. Everything is
 * reduced to raw pixels or PCM so the worker receives transferable buffers.
 */

import type { RawImage } from "@huggingface/transformers"

import type { DecodedInput, PixelFrame } from "./protocol"
import { MAX_AUDIO_SECONDS } from "@/lib/model-info"

/**
 * Loaded on demand so the initial bundle stays free of ONNX Runtime; the worker
 * pulls in its own copy of the library regardless.
 */
const transformers = () => import("@huggingface/transformers")

/** The vision encoder resizes anyway; capping here saves decode and transfer time. */
const MAX_IMAGE_EDGE = 1024
const MAX_VIDEO_EDGE = 512

const AUDIO_SAMPLE_RATE = 16_000
/** 16 frames at 140 tokens each is 2,240 tokens, the sampling the card suggests. */
const VIDEO_FRAMES = 16

type DrawableSource = ImageBitmap | HTMLVideoElement | HTMLImageElement

function sourceSize(source: DrawableSource): [number, number] {
  if (source instanceof HTMLVideoElement)
    return [source.videoWidth, source.videoHeight]
  return [source.width, source.height]
}

function drawToFrame(source: DrawableSource, maxEdge: number): PixelFrame {
  const [sourceWidth, sourceHeight] = sourceSize(source)
  if (sourceWidth === 0 || sourceHeight === 0) {
    throw new Error("The media source has no dimensions yet")
  }

  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not acquire a 2D canvas context")

  context.drawImage(source, 0, 0, width, height)
  const { data } = context.getImageData(0, 0, width, height)
  return { data, width, height }
}

async function rawImageToFrame(
  image: RawImage,
  maxEdge: number
): Promise<PixelFrame> {
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
  const sized =
    scale < 1
      ? await image.resize(
          Math.round(image.width * scale),
          Math.round(image.height * scale)
        )
      : image

  const rgba = sized.rgba()
  return {
    data: new Uint8ClampedArray(rgba.data),
    width: rgba.width,
    height: rgba.height,
  }
}

export async function decodeImage(
  source: string | Blob
): Promise<DecodedInput> {
  const blob =
    typeof source === "string" ? await (await fetch(source)).blob() : source
  const bitmap = await createImageBitmap(blob)
  try {
    return { kind: "image", frame: drawToFrame(bitmap, MAX_IMAGE_EDGE) }
  } finally {
    bitmap.close()
  }
}

/** Grabs the current webcam frame without stalling the preview. */
export function captureFrame(video: HTMLVideoElement): DecodedInput {
  return { kind: "image", frame: drawToFrame(video, MAX_IMAGE_EDGE) }
}

export async function decodeAudio(
  source: string | Blob
): Promise<DecodedInput> {
  const { load_audio } = await transformers()
  const url = typeof source === "string" ? source : URL.createObjectURL(source)
  try {
    const samples = await load_audio(url, AUDIO_SAMPLE_RATE)
    const capped = samples.slice(0, AUDIO_SAMPLE_RATE * MAX_AUDIO_SECONDS)
    return {
      kind: "audio",
      samples: capped,
      durationSec: capped.length / AUDIO_SAMPLE_RATE,
    }
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url)
  }
}

export async function decodeVideo(
  source: string | Blob
): Promise<DecodedInput> {
  const { load_video } = await transformers()
  const video = await load_video(source, { num_frames: VIDEO_FRAMES })
  const frames = await Promise.all(
    video.frames.map((frame) => rawImageToFrame(frame.image, MAX_VIDEO_EDGE))
  )
  return { kind: "video", frames, durationSec: video.duration }
}

export function decodeText(text: string): DecodedInput {
  return { kind: "text", text }
}
