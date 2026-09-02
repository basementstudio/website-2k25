import { useEffect, useState } from "react"
import { DoubleSide, MeshBasicMaterial, NearestFilter } from "three"

import { useMesh } from "@/hooks/use-mesh"

// Renders the net mesh. Its geometry is deformed at play time by the rapier
// lattice in ./net-physics.tsx; outside the basketball scene it shows the
// authored rest pose.
export const Net = () => {
  const [isVisible, setIsVisible] = useState(false)
  const net = useMesh((state) => state.basketball.net)

  useEffect(() => {
    if (!net) return

    const originalMaterial = net.material as any
    if (!originalMaterial || !originalMaterial.map) return

    const texture = originalMaterial.map.clone()
    texture.magFilter = NearestFilter
    texture.minFilter = NearestFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide
    })

    net.material = material
    setIsVisible(true)

    return () => {
      net.material = originalMaterial
      material.dispose()
      texture.dispose()
    }
  }, [net])

  return net && <primitive object={net} visible={isVisible} />
}
