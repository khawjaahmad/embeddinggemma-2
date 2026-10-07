import { MinusIcon, PlusIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { corpusById } from "@/corpus/corpus"
import { CorpusThumb } from "@/corpus/corpus-preview"
import type { Term } from "./terms"

interface TermTileProps {
  term: Term
  leading: boolean
  ready: boolean
  onToggleSign: () => void
  onRemove: () => void
}

export function TermTile({
  term,
  leading,
  ready,
  onToggleSign,
  onRemove,
}: TermTileProps) {
  const item = term.itemId ? corpusById(term.itemId) : undefined

  return (
    <div className="flex items-center gap-1">
      {/* The leading sign is implicit, as in written arithmetic, unless it is negative. */}
      {(!leading || term.sign === -1) && (
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={term.sign === 1 ? "Subtract this term" : "Add this term"}
          onClick={onToggleSign}
        >
          {term.sign === 1 ? <PlusIcon /> : <MinusIcon />}
        </Button>
      )}

      <div className="group relative">
        {item ? (
          <CorpusThumb item={item} className="size-20" />
        ) : (
          <div className="flex size-20 items-center justify-center border bg-card p-2 text-center text-xs leading-tight">
            {term.text}
          </div>
        )}
        {!ready && (
          <span className="absolute bottom-1 left-1 size-1.5 animate-pulse rounded-full bg-foreground" />
        )}
        <Button
          variant="secondary"
          size="icon-xs"
          aria-label="Remove term"
          onClick={onRemove}
          className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
