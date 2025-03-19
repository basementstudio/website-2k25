import { useThree } from "@react-three/fiber"
import { getGPUTier } from "detect-gpu"
import { useCallback, useEffect, useState } from "react"
import { FloatType, HalfFloatType, LinearFilter, NearestFilter } from "three"

// Define settings interface to resolve type issues
interface QualitySettings {
  dpr: number
  targetFps: number
  textureSize: number
  postProcessingEnabled: boolean
  textureType: number
  textureFilter: number
  bloomEnabled: boolean
  particlesMultiplier: number
}

// Quality settings based on GPU capability
const qualitySettings: Record<string, QualitySettings> = {
  low: {
    dpr: 0.75,
    targetFps: 30,
    textureSize: 512,
    postProcessingEnabled: false,
    textureType: HalfFloatType,
    textureFilter: NearestFilter,
    bloomEnabled: false,
    particlesMultiplier: 0.3
  },
  medium: {
    dpr: 1,
    targetFps: 45,
    textureSize: 1024,
    postProcessingEnabled: true,
    textureType: HalfFloatType,
    textureFilter: LinearFilter,
    bloomEnabled: true,
    particlesMultiplier: 0.6
  },
  high: {
    dpr: 1.5,
    targetFps: 60,
    textureSize: 2048,
    postProcessingEnabled: true,
    textureType: FloatType,
    textureFilter: LinearFilter,
    bloomEnabled: true,
    particlesMultiplier: 1
  }
}

export type QualityLevel = "low" | "medium" | "high"

export const usePerformanceOptimizer = () => {
  const [gpuTier, setGpuTier] = useState<number | null>(null)
  const [quality, setQuality] = useState<QualityLevel>("medium")
  const [settings, setSettings] = useState<QualitySettings>(
    qualitySettings.medium
  )
  const [isLoading, setIsLoading] = useState(true)
  const { gl, setDpr } = useThree()

  // Initial GPU detection
  useEffect(() => {
    const detectGpu = async () => {
      try {
        const gpu = await getGPUTier()
        setGpuTier(gpu.tier)

        // Assign quality based on GPU tier
        if (gpu.tier <= 1) {
          setQuality("low")
          setSettings(qualitySettings.low)
        } else if (gpu.tier === 2) {
          setQuality("medium")
          setSettings(qualitySettings.medium)
        } else {
          setQuality("high")
          setSettings(qualitySettings.high)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error detecting GPU:", error)
        // Fallback to medium configuration
        setQuality("medium")
        setSettings(qualitySettings.medium)
        setIsLoading(false)
      }
    }

    detectGpu()
  }, [])

  // Apply DPR when configuration changes
  useEffect(() => {
    if (!isLoading) {
      setDpr(settings.dpr)
    }
  }, [settings, isLoading, setDpr])

  // Change quality manually
  const changeQuality = useCallback((newQuality: QualityLevel) => {
    setQuality(newQuality)
    setSettings(qualitySettings[newQuality])
  }, [])

  // Function to get texture size based on quality
  const getTextureSize = useCallback(() => {
    return settings.textureSize
  }, [settings])

  // Performance adaptation monitoring
  const handlePerformanceChange = useCallback(
    ({ factor }: { factor: number }) => {
      // Only adjust if the change is significant
      if (factor < 0.3 && quality !== "low") {
        changeQuality("low")
      } else if (factor > 0.7 && quality !== "high") {
        changeQuality("high")
      } else if (factor >= 0.3 && factor <= 0.7 && quality !== "medium") {
        changeQuality("medium")
      }
    },
    [quality, changeQuality]
  )

  return {
    quality,
    settings,
    isLoading,
    gpuTier,
    changeQuality,
    getTextureSize,
    handlePerformanceChange
  }
}
