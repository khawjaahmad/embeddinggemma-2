import {
  AudioLinesIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import type { Modality } from "@/lib/model-info"

export const MODALITY_ICONS: Record<Modality, LucideIcon> = {
  text: FileTextIcon,
  image: ImageIcon,
  audio: AudioLinesIcon,
  video: VideoIcon,
}

export const MODALITY_LABELS: Record<Modality, string> = {
  text: "Text",
  image: "Image",
  audio: "Audio",
  video: "Video",
}

/** One fixed hue per modality, used by every chart and tile so identity reads at a glance. */
export const MODALITY_COLORS: Record<Modality, string> = {
  image: "var(--chart-1)",
  audio: "var(--chart-2)",
  video: "var(--chart-3)",
  text: "var(--chart-4)",
}

export function ModalityIcon({
  modality,
  className,
}: {
  modality: Modality
  className?: string
}) {
  const Icon = MODALITY_ICONS[modality]
  return <Icon className={className} />
}

/** Icon tinted with the modality hue; the icon carries identity, not the color alone. */
export function ModalityMark({
  modality,
  className,
}: {
  modality: Modality
  className?: string
}) {
  const Icon = MODALITY_ICONS[modality]
  return (
    <Icon
      aria-label={MODALITY_LABELS[modality]}
      className={cn("size-3.5 shrink-0", className)}
      style={{ color: MODALITY_COLORS[modality] }}
    />
  )
}

/** Chart legend: icon + name per modality, so series identity never relies on color alone. */
export function ModalityLegend({
  modalities,
  className,
}: {
  modalities: Modality[]
  className?: string
}) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}
    >
      {modalities.map((modality) => (
        <span
          key={modality}
          className="flex items-center gap-1 text-[11px] text-muted-foreground"
        >
          <ModalityMark modality={modality} className="size-3" />
          {MODALITY_LABELS[modality]}
        </span>
      ))}
    </div>
  )
}
