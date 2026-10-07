import { useCallback, useEffect, useRef, useState } from "react"

import { useEngine } from "@/embedder/engine-context"
import { captureFrame } from "@/embedder/media"

/** How many recent frame vectors are kept for the timeline. */
const HISTORY_FRAMES = 60

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Opens the webcam and embeds frames back to back for as long as it runs.
 * Frames are sequential rather than on a timer, so the rate adapts to the GPU.
 */
export function useCameraFrames() {
  const { embed } = useEngine()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runningRef = useRef(false)

  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frames, setFrames] = useState<Float32Array[]>([])
  const [frameMs, setFrameMs] = useState(0)

  const stop = useCallback(() => {
    runningRef.current = false
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStreaming(false)
  }, [])

  useEffect(() => stop, [stop])

  const runLoop = useCallback(async () => {
    while (runningRef.current) {
      const video = videoRef.current
      if (!video || video.readyState < 2) {
        await sleep(100)
        continue
      }

      const startedAt = performance.now()
      try {
        const [vector] = await embed([captureFrame(video)])
        if (!runningRef.current) return
        setFrames((previous) => [
          ...previous.slice(-(HISTORY_FRAMES - 1)),
          vector,
        ])
        setFrameMs(performance.now() - startedAt)
      } catch (cause) {
        console.error("Frame embedding failed", cause)
        await sleep(500)
      }

      // Yield so React can paint between frames.
      await sleep(0)
    }
  }, [embed])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, facingMode: "user" },
      })
      streamRef.current = stream

      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()

      setStreaming(true)
      runningRef.current = true
      void runLoop()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not open the camera"
      )
    }
  }, [runLoop])

  return { videoRef, streaming, error, frames, frameMs, start, stop }
}
