/**
 * Promise-based wrapper around the embedding worker.
 */

import type {
  DecodedInput,
  DownloadProgress,
  EngineInfo,
  LoadOptions,
  WorkerRequest,
  WorkerResponse,
} from "./protocol"
import { transferablesOf } from "./protocol"

export interface DownloadSnapshot {
  loaded: number
  total: number
  fraction: number
}

export interface LoadListeners {
  onStage?: (stage: string) => void
  onDownload?: (snapshot: DownloadSnapshot) => void
}

export interface EmbedResult {
  vectors: Float32Array[]
  elapsedMs: number
}

/** `Omit` collapses unions, so distribute it to keep each request shape intact. */
type RequestBody = WorkerRequest extends infer T
  ? T extends WorkerRequest
    ? Omit<T, "id">
    : never
  : never

interface PendingRequest {
  resolve: (value: never) => void
  reject: (reason: Error) => void
  listeners?: LoadListeners
  downloads: Map<string, DownloadProgress>
}

export class EmbedderClient {
  private readonly worker: Worker
  private readonly pending = new Map<number, PendingRequest>()
  private nextId = 1

  constructor() {
    this.worker = new Worker(new URL("./embedder.worker.ts", import.meta.url), {
      type: "module",
    })
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
      this.receive(event.data)
  }

  load(options: LoadOptions, listeners?: LoadListeners): Promise<EngineInfo> {
    return this.send({ type: "load", options }, listeners)
  }

  embed(inputs: DecodedInput[]): Promise<EmbedResult> {
    return this.send(
      { type: "embed", inputs },
      undefined,
      transferablesOf(inputs)
    )
  }

  private send<T>(
    request: RequestBody,
    listeners?: LoadListeners,
    transfer: Transferable[] = []
  ): Promise<T> {
    const id = this.nextId++

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as PendingRequest["resolve"],
        reject,
        listeners,
        downloads: new Map(),
      })
      this.worker.postMessage({ ...request, id } as WorkerRequest, transfer)
    })
  }

  private receive(message: WorkerResponse) {
    const request = this.pending.get(message.id)
    if (!request) return

    if (message.type === "stage") {
      request.listeners?.onStage?.(message.stage)
      return
    }

    if (message.type === "download") {
      request.downloads.set(message.progress.file, message.progress)
      request.listeners?.onDownload?.(summarize(request.downloads))
      return
    }

    this.pending.delete(message.id)

    if (message.type === "failed") {
      request.reject(new Error(message.message))
      return
    }

    const value =
      message.type === "loaded"
        ? message.info
        : { vectors: message.vectors, elapsedMs: message.elapsedMs }
    request.resolve(value as never)
  }
}

function summarize(downloads: Map<string, DownloadProgress>): DownloadSnapshot {
  const files = [...downloads.values()]
  const loaded = files.reduce((sum, file) => sum + file.loaded, 0)
  const total = files.reduce((sum, file) => sum + file.total, 0)
  return { loaded, total, fraction: total > 0 ? loaded / total : 0 }
}
