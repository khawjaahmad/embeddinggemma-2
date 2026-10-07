import { useMemo, useState } from "react"
import {
  ActivityIcon,
  AudioWaveformIcon,
  CameraIcon,
  ListIcon,
  RadarIcon,
  SquareIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Cell, CellGrid } from "@/components/layout/cell"
import { VectorStrip } from "@/components/viz/vector-strip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty"
import { Textarea } from "@/components/ui/textarea"
import { useEngine } from "@/embedder/engine-context"
import { useTextVectors } from "@/embedder/use-text-vectors"
import { formatDuration } from "@/lib/format"
import type { MrlDim } from "@/lib/model-info"
import { ProbeRadar } from "./probe-radar"
import { ProbeReadings } from "./probe-readings"
import { ProbeTimeline } from "./probe-timeline"
import { DEFAULT_PROBES, parseProbes, PROBE_COLORS, readFrames } from "./probes"
import { useCameraFrames } from "./use-camera-frames"

export function LiveLens({ dim }: { dim: MrlDim }) {
  const { info } = useEngine()
  const hasVision = info?.encoders.vision ?? false

  const [probeText, setProbeText] = useState(DEFAULT_PROBES.join("\n"))
  const probes = useMemo(() => parseProbes(probeText), [probeText])
  const textVectors = useTextVectors(hasVision ? probes : [], 500)
  const {
    videoRef,
    streaming,
    error: cameraError,
    frames,
    frameMs,
    start,
    stop,
  } = useCameraFrames()

  // Null until every probe line has been embedded, so readings never mix stale and fresh probes.
  const probeVectors = useMemo(() => {
    const found = probes.flatMap((probe) => textVectors.get(probe) ?? [])
    return probes.length > 0 && found.length === probes.length ? found : null
  }, [probes, textVectors])

  const readings = useMemo(
    () => (probeVectors ? readFrames(frames, probeVectors, dim) : []),
    [frames, probeVectors, dim]
  )
  const latest = readings.at(-1)
  const leader = latest ? latest.scores.indexOf(Math.max(...latest.scores)) : -1

  if (!hasVision) {
    return (
      <Alert>
        <TriangleAlertIcon />
        <AlertTitle>Vision encoder not loaded</AlertTitle>
        <AlertDescription>Sidebar → Encoders → Text + vision.</AlertDescription>
      </Alert>
    )
  }

  return (
    <CellGrid>
      <Cell
        className="lg:col-span-7"
        title="Camera"
        icon={CameraIcon}
        action={
          streaming && (
            <Button size="xs" variant="ghost" onClick={stop}>
              <SquareIcon data-icon="inline-start" />
              Stop
            </Button>
          )
        }
      >
        <div className="relative aspect-video overflow-hidden bg-card">
          <video
            ref={videoRef}
            muted
            playsInline
            className="size-full -scale-x-100 object-cover"
          />

          {!streaming && (
            <Empty className="absolute inset-0 bg-dots">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CameraIcon />
                </EmptyMedia>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={start}>
                  <CameraIcon data-icon="inline-start" />
                  Start camera
                </Button>
              </EmptyContent>
            </Empty>
          )}

          {streaming && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 font-mono"
            >
              {formatDuration(frameMs)}
            </Badge>
          )}

          {streaming && leader >= 0 && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-linear-to-t from-black/80 to-transparent p-3 pt-10">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: PROBE_COLORS[leader] }}
              />
              <span className="truncate text-lg font-medium tracking-tight text-white">
                {probes[leader]}
              </span>
            </div>
          )}
        </div>

        {cameraError && (
          <Alert variant="destructive" className="mt-3">
            <TriangleAlertIcon />
            <AlertTitle>Camera unavailable</AlertTitle>
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}
      </Cell>

      <Cell
        className="lg:col-span-5"
        title="Match"
        icon={RadarIcon}
        contentClassName="flex flex-col gap-4"
      >
        <ProbeRadar scores={latest?.scores ?? []} count={probes.length} />
        <ProbeReadings probes={probes} reading={latest} leader={leader} />
      </Cell>

      <Cell className="lg:col-span-8" title="Timeline" icon={ActivityIcon}>
        <ProbeTimeline readings={readings} count={probes.length} />
      </Cell>

      <Cell className="lg:col-span-4" title="Probes" icon={ListIcon}>
        <Textarea
          aria-label="Probes, one per line"
          rows={7}
          value={probeText}
          onChange={(event) => setProbeText(event.target.value)}
          className="h-full min-h-40 resize-none font-mono text-xs"
        />
      </Cell>

      <Cell
        title="Frame vector"
        icon={AudioWaveformIcon}
        action={
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {frames.length > 0 ? `${dim}d` : "—"}
          </span>
        }
      >
        <VectorStrip vector={frames.at(-1) ?? null} dim={dim} />
      </Cell>
    </CellGrid>
  )
}
