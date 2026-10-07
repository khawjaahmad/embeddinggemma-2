import { useEffect, useRef } from "react"
import { cn } from "cn"

interface VectorStripProps {
  vector: Float32Array | null
  /** Dimensions past this point are drawn faded, showing what Matryoshka truncation drops. */
  dim?: number
  height?: number
  className?: string
}

/**
 * Draws an embedding as a waveform: one column per dimension, up for positive
 * values and down for negative ones. Canvas rather than SVG because the live
 * lens redraws it every frame.
 */
export function VectorStrip({
  vector,
  dim,
  height = 48,
  className,
}: VectorStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const width = canvas.clientWidth
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)

      const context = canvas.getContext("2d")
      if (!context) return
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)

      const style = getComputedStyle(canvas)
      const mid = height / 2
      context.fillStyle = style.getPropertyValue("--border").trim()
      context.fillRect(0, mid, width, 1)
      if (!vector) return

      const positive = style.getPropertyValue("--chart-1").trim()
      const negative = style.getPropertyValue("--chart-2").trim()
      const count = vector.length
      const cut = dim ?? count
      const column = width / count

      let peak = 0
      for (const value of vector) peak = Math.max(peak, Math.abs(value))
      if (peak === 0) return

      for (let index = 0; index < count; index++) {
        const value = vector[index]
        // Square root keeps the many small components visible next to the few spikes.
        const extent = Math.sqrt(Math.abs(value) / peak) * (mid - 1)
        context.globalAlpha = index < cut ? 0.9 : 0.15
        context.fillStyle = value >= 0 ? positive : negative
        context.fillRect(
          index * column,
          value >= 0 ? mid - extent : mid + 1,
          Math.max(column - 0.25, 0.75),
          extent
        )
      }

      if (cut < count) {
        context.globalAlpha = 1
        context.fillStyle = style.getPropertyValue("--foreground").trim()
        context.fillRect(cut * column, 0, 1, height)
      }
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [vector, dim, height])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={
        vector
          ? `Embedding with ${vector.length} dimensions`
          : "No embedding yet"
      }
      className={cn("block w-full", className)}
      style={{ height }}
    />
  )
}
