import { useEffect, useMemo } from "react"
import * as THREE from "three"

import { doubleFbo } from "@/utils/double-fbo"

export function useDoubleFBO(
  width: number,
  height: number,
  options: THREE.RenderTargetOptions
) {
  const fbo = useMemo(() => {
    return doubleFbo(width, height, options)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      fbo.dispose()
    }
  }, [fbo])

  useEffect(() => {
    fbo.read.setSize(width, height)
    fbo.write.setSize(width, height)
  }, [fbo, width, height])

  return fbo
}
