import { PerformanceMonitor } from "@react-three/drei"
import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { memo, useEffect } from "react"

import { cctvConfig } from "@/components/postprocessing/renderer"
import { usePerformanceOptimizer } from "@/hooks/use-performance-optimizer"

interface PerformanceMonitorWrapperProps {
  children: React.ReactNode
}

const PerformanceMonitorWrapper = ({
  children
}: PerformanceMonitorWrapperProps) => {
  const {
    quality,
    settings,
    handlePerformanceChange,
    getTextureSize,
    isLoading
  } = usePerformanceOptimizer()
  const { gl } = useThree()

  // Apply initial configurations based on detected quality
  useEffect(() => {
    if (!isLoading) {
      // Adjust texture sizes
      const textureSize = getTextureSize()
      if (cctvConfig?.renderTarget) {
        cctvConfig.renderTarget.read.setSize(textureSize, textureSize)
        cctvConfig.renderTarget.write.setSize(textureSize, textureSize)
      }

      // Adjust framesPerUpdate for CCTV
      if (cctvConfig) {
        cctvConfig.framesPerUpdate =
          quality === "low" ? 32 : quality === "medium" ? 16 : 8
      }
    }
  }, [quality, isLoading, getTextureSize])

  if (isLoading) return <>{children}</>

  return (
    <>
      <PerformanceMonitor
        bounds={(refreshRate) => [settings.targetFps * 0.5, settings.targetFps]}
        onIncline={() => handlePerformanceChange({ factor: 0.8 })}
        onDecline={() => handlePerformanceChange({ factor: 0.2 })}
        onChange={handlePerformanceChange}
        flipflops={3}
        ms={250}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        {children}
      </PerformanceMonitor>
    </>
  )
}

export default memo(PerformanceMonitorWrapper)
