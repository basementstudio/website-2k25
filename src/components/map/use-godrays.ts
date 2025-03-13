import { animate } from "motion"
import { useCallback, useEffect, useMemo, useRef } from "react"
import type { Mesh, ShaderMaterial } from "three"

import { useCurrentScene } from "@/hooks/use-current-scene"

interface GodraysHandlerProps {
  godrays: Mesh[]
}

// Map to store the state of each specific godray
type GodrayState = Record<
  string,
  {
    shouldShow: boolean
    animation: ReturnType<typeof animate> | null
  }
>

export const useGodrays = ({ godrays }: GodraysHandlerProps) => {
  const scene = useCurrentScene()

  // Reference to keep track of the previous state of each godray
  const godrayStatesRef = useRef<GodrayState>({})

  // Calculate visibility conditions in a memoized way
  const visibilityMap = useMemo(() => {
    const map: Record<string, boolean> = {}

    for (const mesh of godrays) {
      map[mesh.name] =
        (mesh.name === "GR_About" && scene === "services") ||
        (mesh.name === "GR_Home" && scene === "home")
    }

    return map
  }, [scene, godrays])

  // Handle animation for each godray
  const animateGodray = useCallback((mesh: Mesh, shouldShow: boolean) => {
    const material = mesh.material as ShaderMaterial
    const godrayState = godrayStatesRef.current[mesh.name]

    // If the state is the same, do nothing
    if (godrayState && godrayState.shouldShow === shouldShow) {
      return
    }

    // Stop previous animation if it exists
    if (godrayState?.animation) {
      godrayState.animation.stop()
    }

    // Initialize the state if it doesn't exist
    if (!godrayStatesRef.current[mesh.name]) {
      godrayStatesRef.current[mesh.name] = {
        shouldShow,
        animation: null
      }
    }

    // Update the state
    godrayStatesRef.current[mesh.name].shouldShow = shouldShow

    // Create new animation
    const animation = animate(
      material.uniforms.uGodrayOpacity.value,
      shouldShow ? 1 : 0,
      {
        duration: 0.5,
        ease: "easeInOut",
        onUpdate: (latest) => {
          material.uniforms.uGodrayOpacity.value = latest
        },
        onComplete: () => {
          godrayStatesRef.current[mesh.name].animation = null
        }
      }
    )

    // Save animation reference
    godrayStatesRef.current[mesh.name].animation = animation
  }, [])

  useEffect(() => {
    // Process only elements that need to change
    for (const mesh of godrays) {
      const shouldShow = visibilityMap[mesh.name] || false
      animateGodray(mesh, shouldShow)
    }

    // Capture the current state of the ref to use in cleanup
    const currentGodrayStates = { ...godrayStatesRef.current }

    // Cleanup when unmounting
    return () => {
      for (const name in currentGodrayStates) {
        if (currentGodrayStates[name]?.animation) {
          currentGodrayStates[name].animation?.stop()
        }
      }
    }
  }, [godrays, visibilityMap, animateGodray])
}
