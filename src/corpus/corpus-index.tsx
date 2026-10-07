import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { useEngine } from "@/embedder/engine-context"
import {
  CORPUS,
  decodeCorpusItem,
  requiresEncoder,
  type CorpusItem,
} from "./corpus"

export type IndexStatus = "idle" | "indexing" | "ready" | "error"

export interface IndexProgress {
  done: number
  total: number
  label: string | null
}

interface CorpusIndexValue {
  /** Items the currently loaded encoders can actually embed. */
  items: CorpusItem[]
  vectors: Map<string, Float32Array>
  status: IndexStatus
  progress: IndexProgress
  elapsedMs: number
  error: string | null
}

const CorpusIndexContext = createContext<CorpusIndexValue | null>(null)

export function CorpusIndexProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { info, embed } = useEngine()
  // Vectors are keyed by item id only: the text weights never change, so adding
  // an encoder later only costs the newly eligible items.
  const cache = useRef(new Map<string, Float32Array>())

  const [vectors, setVectors] = useState<Map<string, Float32Array>>(new Map())
  const [status, setStatus] = useState<IndexStatus>("idle")
  const [progress, setProgress] = useState<IndexProgress>({
    done: 0,
    total: 0,
    label: null,
  })
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const items = useMemo(() => {
    if (!info) return []
    return CORPUS.filter((item) => {
      const needed = requiresEncoder(item)
      return needed === null || info.encoders[needed]
    })
  }, [info])

  const indexItem = useCallback(
    async (item: CorpusItem) => {
      const cached = cache.current.get(item.id)
      if (cached) return cached

      const decoded = await decodeCorpusItem(item)
      const [vector] = await embed([decoded])
      cache.current.set(item.id, vector)
      return vector
    },
    [embed]
  )

  useEffect(() => {
    if (items.length === 0) return

    let cancelled = false
    const startedAt = performance.now()

    const run = async () => {
      setStatus("indexing")
      setError(null)
      setProgress({ done: 0, total: items.length, label: items[0].title })

      for (const [position, item] of items.entries()) {
        if (cancelled) return
        setProgress({ done: position, total: items.length, label: item.title })

        try {
          const vector = await indexItem(item)
          if (cancelled) return
          setVectors((previous) => new Map(previous).set(item.id, vector))
        } catch (cause) {
          if (cancelled) return
          // One unreachable asset should not abort the whole index.
          console.warn(`Skipping "${item.id}"`, cause)
        }
      }

      if (cancelled) return
      setProgress({ done: items.length, total: items.length, label: null })
      setElapsedMs(performance.now() - startedAt)
      setStatus("ready")
    }

    run().catch((cause) => {
      if (cancelled) return
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus("error")
    })

    return () => {
      cancelled = true
    }
  }, [items, indexItem])

  const value = useMemo(
    () => ({ items, vectors, status, progress, elapsedMs, error }),
    [items, vectors, status, progress, elapsedMs, error]
  )

  return <CorpusIndexContext value={value}>{children}</CorpusIndexContext>
}

export function useCorpusIndex(): CorpusIndexValue {
  const context = use(CorpusIndexContext)
  if (!context)
    throw new Error("useCorpusIndex must be used inside a CorpusIndexProvider")
  return context
}
