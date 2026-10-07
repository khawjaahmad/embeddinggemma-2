import { Suspense, useState } from "react"

import { AppSidebar } from "@/app/app-sidebar"
import { DEMOS } from "@/app/demos"
import { DimensionControl } from "@/app/dimension-control"
import { IndexStatus } from "@/app/index-status"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { CorpusIndexProvider } from "@/corpus/corpus-index"
import type { MrlDim } from "@/lib/model-info"

function PanelFallback() {
  return (
    <div className="grid grid-cols-12 gap-px border bg-border">
      <Skeleton className="col-span-12 h-16 rounded-none" />
      <Skeleton className="col-span-12 h-96 rounded-none lg:col-span-8" />
      <Skeleton className="col-span-12 h-96 rounded-none lg:col-span-4" />
    </div>
  )
}

export function Workspace() {
  const [dim, setDim] = useState<MrlDim>(768)
  const [active, setActive] = useState(DEMOS[0].id)

  const demo = DEMOS.find((entry) => entry.id === active) ?? DEMOS[0]

  return (
    <CorpusIndexProvider>
      <SidebarProvider
        style={{ "--sidebar-width": "15rem" } as React.CSSProperties}
      >
        <AppSidebar nav={DEMOS} active={active} onSelect={setActive} />

        <SidebarInset className="overflow-hidden border md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-2 backdrop-blur-md">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mx-1 h-4 self-center"
            />
            <demo.icon className="size-4 text-muted-foreground" />
            <h1 className="text-sm font-medium">{demo.label}</h1>

            <div className="ml-auto flex items-center gap-4">
              <IndexStatus />
              <DimensionControl dim={dim} onChange={setDim} />
            </div>
          </header>

          <div className="flex-1 p-2 md:p-4">
            {/* Keyed so switching demos remounts and stops things like the camera loop. */}
            <Suspense key={demo.id} fallback={<PanelFallback />}>
              <demo.Panel dim={dim} />
            </Suspense>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CorpusIndexProvider>
  )
}
