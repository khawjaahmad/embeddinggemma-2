export interface GpuSupport {
  supported: boolean
  adapter: string | null
  reason: string | null
}

interface AdapterInfoLike {
  vendor?: string
  architecture?: string
  description?: string
}

function describe(info: AdapterInfoLike | undefined): string | null {
  if (!info) return null
  const parts = [info.description, info.vendor, info.architecture].filter(
    Boolean
  )
  return parts.length > 0 ? (parts[0] as string) : null
}

export async function detectWebGpu(): Promise<GpuSupport> {
  const gpu = (navigator as Navigator & { gpu?: GPU }).gpu
  if (!gpu) {
    return {
      supported: false,
      adapter: null,
      reason:
        "This browser does not expose navigator.gpu. Try Chrome, Edge, or Safari 26+.",
    }
  }

  try {
    const adapter = await gpu.requestAdapter()
    if (!adapter) {
      return {
        supported: false,
        adapter: null,
        reason: "No WebGPU adapter is available on this device.",
      }
    }
    return {
      supported: true,
      adapter: describe(adapter.info as AdapterInfoLike),
      reason: null,
    }
  } catch (error) {
    return {
      supported: false,
      adapter: null,
      reason:
        error instanceof Error
          ? error.message
          : "WebGPU adapter request failed.",
    }
  }
}
