import { useEffect, useState } from "react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { decodeText } from "@/embedder/media"
import { asQuery } from "@/lib/model-info"
import { useEngine } from "./engine-context"

/** Separator that cannot appear in typed text, so the list can be debounced as one string. */
const SEPARATOR = "\u0000"

/**
 * Query-side vectors for a list of short texts, cached by text: editing one
 * line of a list only embeds that line.
 */
export function useTextVectors(
  texts: string[],
  delayMs = 200
): Map<string, Float32Array> {
  const { embed } = useEngine()
  const [vectors, setVectors] = useState<Map<string, Float32Array>>(new Map())
  const debounced = useDebouncedValue(
    [...new Set(texts)].join(SEPARATOR),
    delayMs
  )

  useEffect(() => {
    const missing = debounced
      .split(SEPARATOR)
      .filter((text) => text && !vectors.has(text))
    if (missing.length === 0) return

    let cancelled = false
    embed(missing.map((text) => decodeText(asQuery(text))))
      .then((embedded) => {
        if (cancelled) return
        setVectors((previous) => {
          const next = new Map(previous)
          missing.forEach((text, index) => next.set(text, embedded[index]))
          return next
        })
      })
      .catch((error) => console.error("Text embedding failed", error))

    return () => {
      cancelled = true
    }
  }, [debounced, vectors, embed])

  return vectors
}
