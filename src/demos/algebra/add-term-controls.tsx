import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { MODALITY_LABELS } from "@/components/modality"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MODALITY_ORDER, type CorpusItem } from "@/corpus/corpus"

interface AddTermControlsProps {
  items: CorpusItem[]
  onAddItem: (itemId: string) => void
  onAddText: (text: string) => void
}

/** Adds an operand: a gallery item from the picker, or a concept typed in words. */
export function AddTermControls({
  items,
  onAddItem,
  onAddText,
}: AddTermControlsProps) {
  const [draft, setDraft] = useState("")

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onAddText(text)
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select value="" onValueChange={(value) => value && onAddItem(value)}>
        <SelectTrigger
          className="sm:w-56"
          aria-label="Add an item from the gallery"
        >
          <PlusIcon />
          <SelectValue placeholder="Gallery item" />
        </SelectTrigger>
        <SelectContent>
          {MODALITY_ORDER.map((modality) => {
            const group = items.filter((item) => item.modality === modality)
            if (group.length === 0) return null

            return (
              <SelectGroup key={modality}>
                <SelectLabel>{MODALITY_LABELS[modality]}</SelectLabel>
                {group.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            )
          })}
        </SelectContent>
      </Select>

      <InputGroup className="flex-1">
        <InputGroupInput
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder="Concept"
          aria-label="Add a concept in words"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            onClick={submit}
            disabled={!draft.trim()}
            aria-label="Add concept"
          >
            <PlusIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
