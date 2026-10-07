import { useEffect, useState } from "react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { decodeText } from "@/embedder/media"
import { asQuery, DEFAULT_TASK, type TaskPreset } from "@/lib/model-info"
import { useEngine } from "./engine-context"

interface QueryEmbedding {
  key: string
  vector: Float32Array
  elapsedMs: number
}

/**
 * Embeds a typed query once it stops changing. `busy` is true while the
 * vector on hand belongs to an older query or task.
 */
export function useQueryEmbedding(
  query: string,
  task: TaskPreset = DEFAULT_TASK,
  delayMs = 250
) {
  const { embed } = useEngine()
  const debounced = useDebouncedValue(query.trim(), delayMs)
  const [result, setResult] = useState<QueryEmbedding | null>(null)
  const key = `${task.id}\u0000${debounced}`

  useEffect(() => {
    if (!debounced) return

    let cancelled = false
    const startedAt = performance.now()

    embed([decodeText(asQuery(debounced, task))])
      .then(([vector]) => {
        if (!cancelled)
          setResult({ key, vector, elapsedMs: performance.now() - startedAt })
      })
      .catch((error) => console.error("Query embedding failed", error))

    return () => {
      cancelled = true
    }
  }, [debounced, task, key, embed])

  return {
    vector: result?.vector ?? null,
    elapsedMs: result?.elapsedMs ?? 0,
    busy: Boolean(debounced) && result?.key !== key,
  }
}
