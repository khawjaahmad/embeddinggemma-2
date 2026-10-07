import { Button } from "@/components/ui/button"

interface ExampleChipsProps {
  examples: string[]
  active?: string
  onSelect: (example: string) => void
}

/** One scrollable row of quick-fill examples under an input. */
export function ExampleChips({
  examples,
  active,
  onSelect,
}: ExampleChipsProps) {
  return (
    <div className="-mx-1 scrollbar-none flex gap-1.5 overflow-x-auto px-1">
      {examples.map((example) => (
        <Button
          key={example}
          size="xs"
          variant={example === active ? "secondary" : "ghost"}
          className="font-normal text-muted-foreground"
          onClick={() => onSelect(example)}
        >
          {example}
        </Button>
      ))}
    </div>
  )
}
