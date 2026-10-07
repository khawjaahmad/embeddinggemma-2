/**
 * The demo corpus: one gallery holding four modalities, all indexed into the
 * same 768-dimensional space.
 */

import type { DecodedInput } from "@/embedder/protocol"
import {
  decodeAudio,
  decodeImage,
  decodeText,
  decodeVideo,
} from "@/embedder/media"
import { asDocument, type Modality } from "@/lib/model-info"

const ASSETS =
  "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main"

interface ItemBase {
  id: string
  title: string
}

export type CorpusItem =
  | (ItemBase & { modality: "text"; text: string })
  | (ItemBase & { modality: "image" | "audio" | "video"; src: string })

export const CORPUS: CorpusItem[] = [
  // Images
  {
    id: "cats",
    modality: "image",
    title: "Cats asleep on a couch",
    src: `${ASSETS}/cats.jpg`,
  },
  {
    id: "corgi",
    modality: "image",
    title: "Corgi",
    src: `${ASSETS}/corgi.jpg`,
  },
  {
    id: "tiger",
    modality: "image",
    title: "Tiger",
    src: `${ASSETS}/tiger.jpg`,
  },
  {
    id: "butterfly",
    modality: "image",
    title: "Butterfly",
    src: `${ASSETS}/butterfly.jpg`,
  },
  {
    id: "savanna",
    modality: "image",
    title: "Savanna",
    src: `${ASSETS}/savanna.jpg`,
  },
  {
    id: "beach",
    modality: "image",
    title: "Beach",
    src: `${ASSETS}/beach.png`,
  },
  {
    id: "moraine-lake",
    modality: "image",
    title: "Mountain lake",
    src: `${ASSETS}/moraine-lake.png`,
  },
  {
    id: "new-york",
    modality: "image",
    title: "New York skyline",
    src: `${ASSETS}/new-york.jpg`,
  },
  {
    id: "city-streets",
    modality: "image",
    title: "City streets",
    src: `${ASSETS}/city-streets.jpg`,
  },
  {
    id: "airport",
    modality: "image",
    title: "Airport terminal",
    src: `${ASSETS}/airport.jpg`,
  },
  {
    id: "football",
    modality: "image",
    title: "Football match",
    src: `${ASSETS}/football-match.jpg`,
  },
  {
    id: "astronaut",
    modality: "image",
    title: "Astronaut",
    src: `${ASSETS}/astronaut.png`,
  },
  {
    id: "bread",
    modality: "image",
    title: "Fresh bread",
    src: `${ASSETS}/bread_small.png`,
  },
  {
    id: "receipt",
    modality: "image",
    title: "Receipt",
    src: `${ASSETS}/receipt.png`,
  },
  {
    id: "invoice",
    modality: "image",
    title: "Invoice",
    src: `${ASSETS}/invoice.png`,
  },
  {
    id: "paper",
    modality: "image",
    title: "Scientific paper page",
    src: `${ASSETS}/nougat_paper.png`,
  },

  // Audio
  {
    id: "jfk",
    modality: "audio",
    title: "Presidential speech",
    src: `${ASSETS}/jfk.wav`,
  },
  {
    id: "meow",
    modality: "audio",
    title: "Cat meowing",
    src: `${ASSETS}/cat_meow.wav`,
  },
  {
    id: "barking",
    modality: "audio",
    title: "Dog barking",
    src: `${ASSETS}/dog_barking.wav`,
  },
  {
    id: "piano",
    modality: "audio",
    title: "Piano music",
    src: `${ASSETS}/piano.wav`,
  },
  {
    id: "french",
    modality: "audio",
    title: "Spoken French",
    src: `${ASSETS}/french-audio.wav`,
  },

  // Video
  {
    id: "turtle",
    modality: "video",
    title: "Sea turtle swimming",
    src: `${ASSETS}/sea-turtle.mp4`,
  },
  {
    id: "interview",
    modality: "video",
    title: "Interview",
    src: `${ASSETS}/interview.mp4`,
  },
  {
    id: "courtroom",
    modality: "video",
    title: "Courtroom",
    src: `${ASSETS}/courtroom.mp4`,
  },
  {
    id: "screencast",
    modality: "video",
    title: "Screen recording of a web app",
    src: `${ASSETS}/the-tokenizer-playground.mp4`,
  },

  // Text
  {
    id: "mars",
    modality: "text",
    title: "Mars",
    text: "Mars, known for its reddish appearance, is often referred to as the Red Planet.",
  },
  {
    id: "venus",
    modality: "text",
    title: "Venus",
    text: "Venus is often called Earth's twin because of its similar size and proximity.",
  },
  {
    id: "jupiter",
    modality: "text",
    title: "Jupiter",
    text: "Jupiter, the largest planet in our solar system, has a prominent red spot.",
  },
  {
    id: "aurora",
    modality: "text",
    title: "Aurora",
    text: "Charged particles from the sun excite gases in the upper atmosphere, producing the northern lights.",
  },
  {
    id: "quicksort",
    modality: "text",
    title: "sort.py",
    text: "def quicksort(values):\n    if len(values) <= 1:\n        return values\n    pivot = values[len(values) // 2]\n    left = [v for v in values if v < pivot]\n    right = [v for v in values if v > pivot]\n    return quicksort(left) + [v for v in values if v == pivot] + quicksort(right)",
  },
  {
    id: "debounce",
    modality: "text",
    title: "debounce.ts",
    text: "export function debounce<T extends unknown[]>(fn: (...args: T) => void, waitMs: number) {\n  let timer: ReturnType<typeof setTimeout>\n  return (...args: T) => {\n    clearTimeout(timer)\n    timer = setTimeout(() => fn(...args), waitMs)\n  }\n}",
  },
]

export const MODALITY_ORDER: Modality[] = ["image", "audio", "video", "text"]

export function corpusById(id: string): CorpusItem | undefined {
  return CORPUS.find((item) => item.id === id)
}

export function countByModality(items: CorpusItem[]): Record<Modality, number> {
  const counts: Record<Modality, number> = {
    text: 0,
    image: 0,
    audio: 0,
    video: 0,
  }
  for (const item of items) counts[item.modality]++
  return counts
}

/** Which encoders an item needs, so the UI can hide what is not loaded. */
export function requiresEncoder(item: CorpusItem): "vision" | "audio" | null {
  if (item.modality === "image" || item.modality === "video") return "vision"
  if (item.modality === "audio") return "audio"
  return null
}

export async function decodeCorpusItem(
  item: CorpusItem
): Promise<DecodedInput> {
  if (item.modality === "text")
    return decodeText(asDocument(item.text, item.title))
  if (item.modality === "image") return decodeImage(item.src)
  if (item.modality === "audio") return decodeAudio(item.src)
  return decodeVideo(item.src)
}
