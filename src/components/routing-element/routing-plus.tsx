import { useMemo } from "react"
import { BufferGeometry, Float32BufferAttribute } from "three"

export const RoutingPlus = ({ geometry }: { geometry: BufferGeometry }) => {
  // Create points geometry from the provided geometry
  const pointsGeometry = useMemo(() => {
    if (!geometry.attributes.position || !geometry.attributes.normal)
      return null

    // Create a new buffer geometry for the points
    const pointsGeo = new BufferGeometry()

    // Extract positions from the original geometry
    const positions = []
    const colors = []
    const whiteColor = [1, 1, 1] // RGB for white

    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const x = geometry.attributes.position.array[i * 3]
      const y = geometry.attributes.position.array[i * 3 + 1]
      const z = geometry.attributes.position.array[i * 3 + 2]

      positions.push(x, y, z)
      colors.push(...whiteColor) // Add white color for each point
    }

    // Set attributes
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
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White color for the cross
      } else {
        discard; // Transparent for everything else
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
