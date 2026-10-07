import { SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { TASK_PRESETS, type TaskPreset } from "@/lib/model-info"

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  task: TaskPreset
  onTaskChange: (task: TaskPreset) => void
  busy: boolean
}

export function SearchBar({
  query,
  onQueryChange,
  task,
  onTaskChange,
  busy,
}: SearchBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <InputGroup className="h-10 flex-1">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="A scene, a sound, a document…"
          aria-label="Search query"
        />
        {busy && (
          <InputGroupAddon align="inline-end">
            <Spinner />
          </InputGroupAddon>
        )}
      </InputGroup>

      <Select
        value={task.id}
        onValueChange={(value) =>
          onTaskChange(
            TASK_PRESETS.find((preset) => preset.id === value) ??
              TASK_PRESETS[0]
          )
        }
      >
        <SelectTrigger className="h-10! sm:w-48" aria-label="Task prefix">
          <SelectValue>
            {(value) =>
              TASK_PRESETS.find((preset) => preset.id === value)?.label
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {TASK_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
