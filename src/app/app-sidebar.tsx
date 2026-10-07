import { useState } from "react"
import {
  CheckIcon,
  ExternalLinkIcon,
  SlidersHorizontalIcon,
  TerminalIcon,
} from "lucide-react"
import { cn } from "cn"

import type { Demo } from "@/app/demos"
import { CorpusMix } from "@/corpus/corpus-mix"
import { MODALITY_COLORS, MODALITY_ICONS } from "@/components/modality"
import { ModelGate } from "@/app/model-gate"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useEngine } from "@/embedder/engine-context"
import { formatDuration } from "@/lib/format"
import {
  BASE_MODEL_URL,
  GGUF_URL,
  MODEL_URL,
  type Modality,
} from "@/lib/model-info"

const LLAMA_COMMAND = "llama serve -hf unsloth/embeddinggemma-2-GGUF:UD-Q4_K_XL"

const LINKS = [
  { label: "ONNX weights", href: MODEL_URL },
  { label: "GGUF build", href: GGUF_URL },
  { label: "Original checkpoint", href: BASE_MODEL_URL },
]

interface AppSidebarProps {
  nav: Pick<Demo, "id" | "label" | "icon">[]
  active: string
  onSelect: (id: string) => void
}

export function AppSidebar({ nav, active, onSelect }: AppSidebarProps) {
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="**:data-[slot=sidebar-inner]:border **:data-[slot=sidebar-inner]:bg-background"
    >
      <SidebarHeader className="flex-row items-center gap-2 border-b p-3 group-data-[collapsible=icon]:px-2">
        <img src="/gemma-logo.svg" alt="" className="size-6 shrink-0" />
        <span className="truncate text-sm font-medium tracking-tight group-data-[collapsible=icon]:hidden">
          EmbeddingGemma 2
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {nav.map((entry) => (
                <SidebarMenuItem key={entry.id}>
                  <SidebarMenuButton
                    isActive={entry.id === active}
                    tooltip={entry.label}
                    onClick={() => onSelect(entry.id)}
                  >
                    <entry.icon />
                    <span>{entry.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Corpus</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <CorpusMix />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t p-3 group-data-[collapsible=icon]:px-2">
        <EngineReadout />
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <ModelSettingsDialog />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <CopyCommandButton />
          </SidebarMenuItem>
          {LINKS.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                size="sm"
                tooltip={link.label}
                render={<a href={link.href} target="_blank" rel="noreferrer" />}
                className="text-muted-foreground"
              >
                <ExternalLinkIcon />
                <span>{link.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

const ENCODERS: { key: "text" | "vision" | "audio"; modality: Modality }[] = [
  { key: "text", modality: "text" },
  { key: "vision", modality: "image" },
  { key: "audio", modality: "audio" },
]

/** Which encoders are live, as lit or dimmed icons, plus throughput. */
function EngineReadout() {
  const { info, stats } = useEngine()
  if (!info) return null

  return (
    <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
      {ENCODERS.map(({ key, modality }) => {
        const Icon = MODALITY_ICONS[modality]
        const on = key === "text" || info.encoders[key]
        return (
          <Icon
            key={key}
            aria-label={`${key} encoder ${on ? "loaded" : "not loaded"}`}
            className={cn("size-3.5", !on && "opacity-20")}
            style={{ color: on ? MODALITY_COLORS[modality] : undefined }}
          />
        )
      })}
      <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
        {stats.calls > 0
          ? `${formatDuration(stats.msPerItem)}/item`
          : info.device}
      </span>
    </div>
  )
}

function ModelSettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <SidebarMenuButton size="sm" tooltip="Encoders">
            <SlidersHorizontalIcon />
            <span>Encoders</span>
          </SidebarMenuButton>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Encoders</DialogTitle>
        </DialogHeader>
        <ModelGate />
      </DialogContent>
    </Dialog>
  )
}

function CopyCommandButton() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(LLAMA_COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <SidebarMenuButton
      size="sm"
      tooltip={LLAMA_COMMAND}
      onClick={copy}
      className="text-muted-foreground"
    >
      {copied ? <CheckIcon /> : <TerminalIcon />}
      <span>{copied ? "Copied" : "llama serve"}</span>
    </SidebarMenuButton>
  )
}
