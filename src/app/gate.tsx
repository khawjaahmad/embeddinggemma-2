import { LockIcon } from "lucide-react"

import { Cell, CellGrid, Stat } from "@/components/layout/cell"
import { MODALITY_ORDER } from "@/corpus/corpus"
import { ModalityMark } from "@/components/modality"
import { ModelGate } from "@/app/model-gate"
import { Badge } from "@/components/ui/badge"
import { CONTEXT_WINDOW, NATIVE_DIM } from "@/lib/model-info"

const FACTS = [
  { value: `${NATIVE_DIM}d`, label: "one space" },
  { value: "100+", label: "languages" },
  { value: `${CONTEXT_WINDOW / 1024}K`, label: "context" },
]

/** Shown until the model is loaded: what it is, at a glance, and the load control. */
export function Gate() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-dots p-4">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-2">
          <img src="/gemma-logo.svg" alt="" className="size-6" />
          <span className="text-sm font-medium">EmbeddingGemma 2</span>
          <Badge variant="outline" className="ml-auto">
            <LockIcon data-icon="inline-start" />
            On-device
          </Badge>
        </div>

        <h1 className="text-4xl font-medium tracking-tight text-balance sm:text-5xl">
          Search anything, with anything.
        </h1>

        <CellGrid>
          <Cell
            className="sm:col-span-3"
            contentClassName="flex flex-col justify-end gap-1 p-4"
          >
            <span className="flex h-8 items-center gap-2">
              {MODALITY_ORDER.map((modality) => (
                <ModalityMark
                  key={modality}
                  modality={modality}
                  className="size-5"
                />
              ))}
            </span>
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
              modalities
            </span>
          </Cell>
          {FACTS.map((fact) => (
            <Cell key={fact.label} className="col-span-4 sm:col-span-3">
              <Stat value={fact.value} label={fact.label} />
            </Cell>
          ))}
          <Cell>
            <ModelGate />
          </Cell>
        </CellGrid>
      </div>
    </div>
  )
}
