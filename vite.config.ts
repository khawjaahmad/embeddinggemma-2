import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

/**
 * Cross-origin isolation unlocks SharedArrayBuffer, which ONNX Runtime needs to
 * run its WASM fallback on several threads instead of one (about 4x faster).
 * `credentialless` keeps cross-origin media loading without CORP headers.
 * Mirrored in vercel.json for production.
 */
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
}

export default defineConfig({
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  // Transformers.js ships its own wasm/mjs assets for ONNX Runtime; pre-bundling
  // them breaks the runtime's asset resolution.
  optimizeDeps: {
    exclude: ["@huggingface/transformers"],
  },
  worker: {
    format: "es",
  },
  build: {
    target: "esnext",
  },
})
