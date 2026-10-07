# EmbeddingGemma 2 on WebGPU

A browser demo of [EmbeddingGemma 2](https://huggingface.co/google/embeddinggemma-2), Google DeepMind's multimodal embedding model, running entirely on WebGPU. Text, images, audio and video are mapped into one shared 768-dimensional space, so a typed sentence can rank a video clip against a photo against a sound. Nothing is uploaded; every embedding is computed on the local GPU.

Built with Vite, React 19, [Transformers.js](https://huggingface.co/docs/transformers.js), [shadcn/ui](https://ui.shadcn.com) on Base UI, Tailwind CSS v4 and Recharts.

## Running it

```bash
npm install
npm run dev
```

Needs a browser with WebGPU (Chrome 113+, Edge 113+, or Safari 26+). The app detects support and says so if it is missing.

| Script              | Purpose                               |
| :------------------ | :------------------------------------ |
| `npm run dev`       | Dev server                            |
| `npm run build`     | Typecheck and production build        |
| `npm run lint`      | ESLint                                |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm run format`    | Prettier, with Tailwind class sorting |

## The interface

A dark dashboard: a sidebar to switch demos, a header with the indexing ring and the vector-size switch (768, 512, 256, 128), and each demo laid out as a grid of panels. Results are shown as thumbnails, charts and vector plots rather than prose, and each modality keeps one colour everywhere: image blue, audio orange, video green, text amber.

The first screen picks which encoders to load, drawn as bars sized by download: text only (175 MB), text and vision (284 MB), or everything (624 MB). After loading, the 31-item gallery (16 images, 5 audio clips, 4 videos, 6 documents) is indexed in the background; items whose encoder is not loaded are skipped.

## The four demos

**Search** ranks the whole gallery against one text query. It shows a ranked thumbnail grid, the top match playable in place, a score spectrum of every item coloured by modality, the best hit per modality, and the query embedding drawn as a waveform. A task picker switches the model card's query prefixes (search, question answering, fact checking, code retrieval).

**Live lens** embeds webcam frames back to back and scores each against prompts you write. A radar chart shows the current frame against every prompt, a stacked timeline shows how the match shifts over the last 60 frames, and the best prompt is overlaid on the video. Needs the vision encoder. The video never leaves the tab.

**Algebra** adds and subtracts embeddings across modalities, then searches with the result: a photo of cats, minus "cats", plus "dogs", returns a corgi. A heatmap shows how close each result sits to each term.

**Matryoshka** re-ranks one query at all four sizes. A bump chart traces how the top 5 reshuffles from 768 down to 128, rings count how much of the top 5 survives, and the model card's benchmark scores and storage per million vectors sit alongside.

## How it works

**Model loading is selective.** The vision and audio encoders are separate files, so nulling their configs before `AutoModel.from_pretrained` skips those downloads entirely.

**Precision is per component.** The text and vision encoders run at `q4`; the audio encoder runs at `q8`, because the model card singles out audio as the modality 4-bit quantization affects most. See `DTYPE` in `src/lib/model-info.ts`.

**Media is decoded on the main thread, inference runs in a worker.** This split is forced rather than chosen: `load_video` needs a DOM `<video>` element and `load_audio` needs an `AudioContext`, neither of which exists in a worker. The main thread decodes to raw pixels and PCM, which transfer to the worker without copying.

**Batches are sized by real token counts.** WebGPU kernels exceed a GPU dispatch limit above roughly 2,700 tokens, so the worker tokenizes before batching and groups text by padded cost (batch size times longest sequence). Oversized inputs are truncated at the tokenizer. Media is embedded one item at a time, since a single image already costs 280 tokens.

**Truncated vectors are re-normalized.** Slicing a unit vector does not preserve unit length, and skipping the re-normalization degrades ranking silently rather than raising an error. See `truncate` in `src/lib/vector.ts`.

## Layout

The code is layered so that each folder depends only on the ones below it.

```
src/
  app/           Shell: gate screen, sidebar, header controls, demo registry
  demos/         One folder per demo; a container component plus its views,
    search/        hooks and pure helpers (e.g. demos/lens/use-camera-frames.ts,
    lens/          demos/matryoshka/rankings.ts)
    algebra/
    matryoshka/
  corpus/        The gallery, its background index, ranking, and corpus views
  embedder/      Worker, protocol, main-thread media decoding, engine context,
                 embedding hooks
  components/
    layout/      Cell grid (the dashboard panel)
    viz/         Vector strip, score meter, progress ring, chart tooltip
    ui/          shadcn primitives
  hooks/         Generic React hooks
  lib/           Pure functions and constants: model facts, vector math,
                 formatting, palette, WebGPU detection
```

`src/lib/model-info.ts` is the single source of truth for everything quoted from the model card: task prefixes, benchmark scores, token budgets and download sizes. Demos never rank by hand; they call `scoreCorpus` in `src/corpus/ranking.ts` and embed through `useQueryEmbedding` or `useTextVectors` in `src/embedder/`.

## Deploying

The repo includes a `vercel.json` for a static SPA deploy. No special headers are needed; WebGPU does not require cross-origin isolation, and adding COOP/COEP would break the cross-origin fetches of model weights and demo assets.

## Credits

Model by Google DeepMind under Apache 2.0. Weights used here are the [ONNX build](https://huggingface.co/onnx-community/embeddinggemma-2-ONNX); [GGUF builds](https://huggingface.co/unsloth/embeddinggemma-2-GGUF) are linked in the app for running the same model outside the browser. Demo assets come from the [Transformers.js docs dataset](https://huggingface.co/datasets/Xenova/transformers.js-docs). The dashboard look follows the free [Shadcn Dashboard](https://shadcndashboard.dev) template.
