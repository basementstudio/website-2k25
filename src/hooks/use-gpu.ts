import { useEffect, useState } from "react"

export const useGpu = () => {
  const [gpuEnabled, setGpuEnabled] = useState(true)

  useEffect(() => {
    const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator
    setGpuEnabled(hasWebGPU)
  }, [])

  return gpuEnabled
}
