import { useMemo } from "react"
import { BufferGeometry, Float32BufferAttribute } from "three"

export const RoutingPlus = ({ geometry }: { geometry: BufferGeometry }) => {
  const pointsGeometry = useMemo(() => {
    if (!geometry.attributes.position || !geometry.attributes.normal)
      return null

    const pointsGeo = new BufferGeometry()

    const positions = []
    const colors = []
    const whiteColor = [1, 1, 1]

    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const x = geometry.attributes.position.array[i * 3]
      const y = geometry.attributes.position.array[i * 3 + 1]
      const z = geometry.attributes.position.array[i * 3 + 2]

      positions.push(x, y, z)
      colors.push(...whiteColor)
    }

    pointsGeo.setAttribute("position", new Float32BufferAttribute(positions, 3))
    pointsGeo.setAttribute("color", new Float32BufferAttribute(colors, 3))

    return pointsGeo
  }, [geometry])

  // Shader code
  const vertexShader = `
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 8.0;
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    void main() {
      vec2 coord = gl_PointCoord * 2.0 - 1.0;
      float thickness = 0.25;

      if (abs(coord.x) < thickness || abs(coord.y) < thickness) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      } else {
        discard; 
      }
    }
  `

  return pointsGeometry ? (
    <points>
      <primitive object={pointsGeometry} attach="geometry" />
      <shaderMaterial
        attach="material"
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthTest={false}
        depthWrite={false}
      />
    </points>
  ) : null
}
