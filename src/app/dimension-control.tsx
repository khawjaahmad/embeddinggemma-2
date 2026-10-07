import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  benchmarkFor,
  MRL_DIMS,
  MULTIMODAL_FLOOR,
  type MrlDim,
} from "@/lib/model-info"

interface DimensionControlProps {
  dim: MrlDim
  onChange: (dim: MrlDim) => void
}

export function DimensionControl({ dim, onChange }: DimensionControlProps) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      value={[String(dim)]}
      onValueChange={(value) =>
        value[0] && onChange(Number(value[0]) as MrlDim)
      }
      aria-label="Vector size"
    >
      {MRL_DIMS.map((option) => {
        const benchmark = benchmarkFor(option)
        const degrades = benchmark.mmeb < MULTIMODAL_FLOOR

        return (
          <Tooltip key={option}>
            <TooltipTrigger
              render={
                <ToggleGroupItem
                  value={String(option)}
                  className="relative font-mono text-xs"
                >
                  {option}
                  {degrades && (
                    <span className="absolute top-1 right-1 size-1 rounded-full bg-destructive" />
                  )}
                </ToggleGroupItem>
              }
            />
            <TooltipContent className="font-mono">
              {benchmark.compression} · MTEB {benchmark.mtebMultilingual} · MMEB{" "}
              {benchmark.mmeb}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </ToggleGroup>
  )
}
