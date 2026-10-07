type Sign = 1 | -1

/** One operand of the equation: either a corpus item or a free-text concept. */
export interface Term {
  key: string
  sign: Sign
  itemId?: string
  text?: string
}

export interface Preset {
  label: string
  terms: Term[]
}

export const PRESETS: Preset[] = [
  {
    label: "cats − cats + dogs",
    terms: [
      { key: "a1", sign: 1, itemId: "cats" },
      { key: "a2", sign: -1, text: "cats" },
      { key: "a3", sign: 1, text: "dogs" },
    ],
  },
  {
    label: "turtle − ocean + city",
    terms: [
      { key: "b1", sign: 1, itemId: "turtle" },
      { key: "b2", sign: -1, text: "the ocean" },
      { key: "b3", sign: 1, text: "a busy city" },
    ],
  },
  {
    label: "animal + sound",
    terms: [
      { key: "c1", sign: 1, text: "an animal" },
      { key: "c2", sign: 1, text: "a recorded sound" },
    ],
  },
  {
    label: "New York − buildings + nature",
    terms: [
      { key: "d1", sign: 1, itemId: "new-york" },
      { key: "d2", sign: -1, text: "tall buildings" },
      { key: "d3", sign: 1, text: "untouched nature" },
    ],
  },
]

let termCounter = 0

export function createTerm(
  source: { itemId: string } | { text: string }
): Term {
  return { key: `term-${++termCounter}`, sign: 1, ...source }
}
