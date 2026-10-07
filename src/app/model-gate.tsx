import { useEffect, useState } from "react"
import { CpuIcon, DownloadIcon, TriangleAlertIcon } from "lucide-react"

import { MODALITY_COLORS, MODALITY_ICONS } from "@/components/modality"
import { useEngine } from "@/embedder/engine-context"
import type { EncoderSelection } from "@/embedder/protocol"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatBytes, formatPercent } from "@/lib/format"
import {
  COMPONENT_BYTES,
  COMPONENT_PARAMS,
  DTYPE,
  type Modality,
} from "@/lib/model-info"
import { detectWebGpu, type GpuSupport } from "@/lib/webgpu"

interface EncoderPreset {
  id: string
  label: string
  encoders: EncoderSelection
}

const PRESETS: EncoderPreset[] = [
  { id: "text", label: "Text", encoders: { vision: false, audio: false } },
  {
    id: "vision",
    label: "Text + vision",
    encoders: { vision: true, audio: false },
  },
  { id: "full", label: "Everything", encoders: { vision: true, audio: true } },
]

/** Each downloadable component, drawn as one segment of the size bar. */
const COMPONENTS: {
  key: keyof typeof COMPONENT_BYTES
  modality: Modality
  on: (e: EncoderSelection) => boolean
}[] = [
  { key: "text", modality: "text", on: () => true },
  { key: "vision", modality: "image", on: (e) => e.vision },
  { key: "audio", modality: "audio", on: (e) => e.audio },
]

const FULL_BYTES =
  COMPONENT_BYTES.text + COMPONENT_BYTES.vision + COMPONENT_BYTES.audio

function downloadSize(encoders: EncoderSelection): number {
  return COMPONENTS.reduce(
    (total, part) =>
      total + (part.on(encoders) ? COMPONENT_BYTES[part.key] : 0),
    0
  )
}

export function ModelGate({
  initialPreset = "vision",
}: {
  initialPreset?: string
}) {
  const { status, stage, download, error, load } = useEngine()
  const [gpu, setGpu] = useState<GpuSupport | null>(null)
  const [presetId, setPresetId] = useState(initialPreset)

  useEffect(() => {
    detectWebGpu().then(setGpu)
  }, [])

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[1]
  const isLoading = status === "loading"

  if (gpu && !gpu.supported) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>WebGPU unavailable</AlertTitle>
        <AlertDescription>{gpu.reason}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        className="w-full flex-col items-stretch sm:flex-row"
        value={[presetId]}
        onValueChange={(value) => value[0] && setPresetId(value[0] as string)}
        disabled={isLoading}
        variant="outline"
        spacing={0}
      >
        {PRESETS.map((option) => (
          <ToggleGroupItem
            key={option.id}
            value={option.id}
            className="h-auto flex-1 flex-col items-stretch gap-3 rounded-none! px-4 py-3"
          >
            <span className="flex items-center gap-1.5">
              {COMPONENTS.filter((part) => part.on(option.encoders)).map(
                (part) => {
                  const Icon = MODALITY_ICONS[part.modality]
                  return (
                    <Icon
                      key={part.key}
                      style={{ color: MODALITY_COLORS[part.modality] }}
                    />
                  )
                }
              )}
              <span className="ml-1 text-sm font-medium">{option.label}</span>
            </span>
            <SizeBar encoders={option.encoders} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          disabled={isLoading || !gpu}
          onClick={() =>
            load({ device: "webgpu", dtype: DTYPE, encoders: preset.encoders })
          }
        >
          {isLoading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <DownloadIcon data-icon="inline-start" />
          )}
          {isLoading
            ? "Loading"
            : `Load ${formatBytes(downloadSize(preset.encoders))}`}
        </Button>

        {gpu?.adapter && (
          <Badge variant="outline" className="font-mono">
            <CpuIcon data-icon="inline-start" />
            {gpu.adapter}
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 font-mono text-xs text-muted-foreground tabular-nums">
            <span className="truncate">{stage ?? "…"}</span>
            <span>
              {download && download.total > 0
                ? `${formatBytes(download.loaded)} / ${formatBytes(download.total)}`
                : formatPercent(download?.fraction ?? 0)}
            </span>
          </div>
          <Progress value={Math.round((download?.fraction ?? 0) * 100)} />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Load failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/** Download size as segments on a common scale, so presets compare by length. */
function SizeBar({ encoders }: { encoders: EncoderSelection }) {
  return (
    <span className="flex flex-col gap-1.5">
      <span className="flex h-1.5 gap-0.5">
        {COMPONENTS.filter((part) => part.on(encoders)).map((part) => (
          <span
            key={part.key}
            title={`${part.key} · ${COMPONENT_PARAMS[part.key]} · ${formatBytes(COMPONENT_BYTES[part.key])}`}
            className="h-full rounded-[2px]"
            style={{
              width: `${(COMPONENT_BYTES[part.key] / FULL_BYTES) * 100}%`,
              backgroundColor: MODALITY_COLORS[part.modality],
            }}
          />
        ))}
      </span>
      <span className="text-left font-mono text-[11px] text-muted-foreground tabular-nums">
        {formatBytes(downloadSize(encoders))}
      </span>
    </span>
  )
}
