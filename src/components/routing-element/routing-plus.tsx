import { useMemo } from "react"
import { BufferGeometry, ShaderMaterial, Float32BufferAttribute } from "three"

interface CornerVertex {
  position: [number, number, number]
  normal: [number, number, number]
}

export const RoutingPlus = ({ geometry }: { geometry: BufferGeometry }) => {
  const particleMaterial = new ShaderMaterial({
    uniforms: {
      fixedSize: { value: 10.0 }
    },
    vertexShader: `
      uniform float fixedSize;

      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        
        gl_PointSize = fixedSize;
      }
    `,
    fragmentShader: `
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        
        float square = smoothstep(0.9, 0.8, max(abs(uv.x), abs(uv.y)));
        
        // add cross
        float crossThickness = 0.2;
        float horizontalBar = step(abs(uv.y), crossThickness);
        float verticalBar = step(abs(uv.x), crossThickness);
        float cross = max(horizontalBar, verticalBar);
        
        gl_FragColor = vec4(1.0, 1.0, 1.0, cross * square);
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })

  const cornerVertices = useMemo(() => {
    if (!geometry.attributes.position) return [] as CornerVertex[]

    const positions = geometry.attributes.position
    const count = positions.count
    const corners: CornerVertex[] = []

    geometry.computeBoundingBox()
    const bbox = geometry.boundingBox

    if (!bbox) return [] as CornerVertex[]
    const { min, max } = bbox

    const threshold = 0.01

    for (let i = 0; i < count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)

      let extremeCount = 0
      if (Math.abs(x - min.x) < threshold || Math.abs(x - max.x) < threshold)
        extremeCount++
      if (Math.abs(y - min.y) < threshold || Math.abs(y - max.y) < threshold)
        extremeCount++
      if (Math.abs(z - min.z) < threshold || Math.abs(z - max.z) < threshold)
        extremeCount++

      if (extremeCount >= 2) {
        corners.push({
          position: [x, y, z] as [number, number, number],
          normal: geometry.attributes.normal
            ? ([
                geometry.attributes.normal.getX(i),
                geometry.attributes.normal.getY(i),
                geometry.attributes.normal.getZ(i)
              ] as [number, number, number])
            : ([0, 0, 1] as [number, number, number])
        })
      }
    }

    return corners
  }, [geometry])

  const particlesGeometry = useMemo(() => {
    if (cornerVertices.length === 0) return null

    const particleGeometry = new BufferGeometry()
    const positions: number[] = []

    cornerVertices.forEach((corner) => {
      const x = corner.position[0]
      const y = corner.position[1]
      const z = corner.position[2]

      positions.push(x, y, z)
    })

    particleGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    )
    return particleGeometry
  }, [cornerVertices])

  const cornerParticles = particlesGeometry ? (
    <points>
      <primitive object={particlesGeometry} attach="geometry" />
      <primitive object={particleMaterial} attach="material" />
    </points>
  ) : null

  return cornerParticles
}
