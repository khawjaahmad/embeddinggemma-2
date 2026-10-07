import { lazy, type ComponentType } from "react"
import {
  LayersIcon,
  ScanEyeIcon,
  ScissorsIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react"

import type { MrlDim } from "@/lib/model-info"

export interface Demo {
  id: string
  label: string
  icon: LucideIcon
  /** Every demo re-ranks at the vector size chosen in the header. */
  Panel: ComponentType<{ dim: MrlDim }>
}

/** Each panel is its own chunk; only the active demo's code is ever fetched. */
const UnifiedSearch = lazy(async () => ({
  default: (await import("@/demos/search/unified-search")).UnifiedSearch,
}))
const LiveLens = lazy(async () => ({
  default: (await import("@/demos/lens/live-lens")).LiveLens,
}))
const SemanticAlgebra = lazy(async () => ({
  default: (await import("@/demos/algebra/semantic-algebra")).SemanticAlgebra,
}))
const MatryoshkaLab = lazy(async () => ({
  default: (await import("@/demos/matryoshka/matryoshka-lab")).MatryoshkaLab,
}))

export const DEMOS: Demo[] = [
  { id: "search", label: "Search", icon: SearchIcon, Panel: UnifiedSearch },
  { id: "lens", label: "Live lens", icon: ScanEyeIcon, Panel: LiveLens },
  { id: "algebra", label: "Algebra", icon: LayersIcon, Panel: SemanticAlgebra },
  {
    id: "matryoshka",
    label: "Matryoshka",
    icon: ScissorsIcon,
    Panel: MatryoshkaLab,
  },
]
