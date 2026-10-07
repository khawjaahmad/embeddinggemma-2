import { cn } from "cn"

import { MODALITY_COLORS, ModalityIcon } from "@/components/modality"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { CorpusItem } from "@/corpus/corpus"

/** Seeking slightly into a video makes browsers paint a real frame as the poster. */
function posterSrc(src: string) {
  return `${src}#t=0.5`
}

export function CorpusThumb({
  item,
  className,
}: {
  item: CorpusItem
  className?: string
}) {
  const shared = cn("size-12 shrink-0 overflow-hidden bg-muted", className)

  if (item.modality === "image") {
    return (
      <img
        src={item.src}
        alt={item.title}
        loading="lazy"
        className={cn(shared, "object-cover")}
      />
    )
  }

  if (item.modality === "video") {
    return (
      <video
        src={posterSrc(item.src)}
        preload="metadata"
        muted
        playsInline
        className={cn(shared, "object-cover")}
      />
    )
  }

  // Audio and text have no picture, so they get a tile tinted with their modality hue.
  const color = MODALITY_COLORS[item.modality]
  return (
    <div
      className={cn(shared, "flex items-center justify-center")}
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
      }}
    >
      <ModalityIcon
        modality={item.modality}
        className="size-1/3 min-h-3 min-w-3"
      />
    </div>
  )
}

export function CorpusPreview({ item }: { item: CorpusItem }) {
  if (item.modality === "text") {
    return (
      <pre className="max-h-[60vh] overflow-auto border bg-muted/50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {item.text}
      </pre>
    )
  }

  if (item.modality === "image") {
    return (
      <img
        src={item.src}
        alt={item.title}
        className="max-h-[60vh] w-full object-contain"
      />
    )
  }

  if (item.modality === "video") {
    return (
      <video
        src={item.src}
        controls
        playsInline
        className="max-h-[60vh] w-full"
      />
    )
  }

  return <audio src={item.src} controls className="w-full" />
}

export function CorpusItemDialog({
  item,
  children,
}: {
  item: CorpusItem
  children: React.ReactElement
}) {
  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
        </DialogHeader>
        <CorpusPreview item={item} />
      </DialogContent>
    </Dialog>
  )
}
