import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react"

import { EmbedderClient, type DownloadSnapshot } from "./client"
import type { DecodedInput, EngineInfo, LoadOptions } from "./protocol"

export type EngineStatus = "idle" | "loading" | "ready" | "error"

export interface EngineStats {
  calls: number
  items: number
  msPerItem: number
}

interface EngineContextValue {
  status: EngineStatus
  stage: string | null
  download: DownloadSnapshot | null
  info: EngineInfo | null
  error: string | null
  stats: EngineStats
  load: (options: LoadOptions) => Promise<void>
  embed: (inputs: DecodedInput[]) => Promise<Float32Array[]>
}

const EngineContext = createContext<EngineContextValue | null>(null)

const EMPTY_STATS: EngineStats = { calls: 0, items: 0, msPerItem: 0 }

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<EmbedderClient | null>(null)
  const [status, setStatus] = useState<EngineStatus>("idle")
  const [stage, setStage] = useState<string | null>(null)
  const [download, setDownload] = useState<DownloadSnapshot | null>(null)
  const [info, setInfo] = useState<EngineInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<EngineStats>(EMPTY_STATS)

  const client = useCallback(() => {
    clientRef.current ??= new EmbedderClient()
    return clientRef.current
  }, [])

  const load = useCallback(
    async (options: LoadOptions) => {
      setStatus("loading")
      setError(null)
      setDownload(null)
      setStats(EMPTY_STATS)

      try {
        const loaded = await client().load(options, {
          onStage: setStage,
          onDownload: setDownload,
        })
        setInfo(loaded)
        setStatus("ready")
        setStage(null)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
        setStatus("error")
      }
    },
    [client]
  )

  const embed = useCallback(
    async (inputs: DecodedInput[]) => {
      const { vectors, elapsedMs } = await client().embed(inputs)
      setStats((previous) => {
        const items = previous.items + inputs.length
        const calls = previous.calls + 1
        const msPerItem =
          (previous.msPerItem * previous.items + elapsedMs) / Math.max(items, 1)
        return { calls, items, msPerItem }
      })
      return vectors
    },
    [client]
  )

  const value = useMemo(
    () => ({ status, stage, download, info, error, stats, load, embed }),
    [status, stage, download, info, error, stats, load, embed]
  )

  return <EngineContext value={value}>{children}</EngineContext>
}

export function useEngine(): EngineContextValue {
  const context = use(EngineContext)
  if (!context)
    throw new Error("useEngine must be used inside an EngineProvider")
  return context
}
