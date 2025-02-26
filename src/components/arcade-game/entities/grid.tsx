import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import {
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  ShaderMaterial,
  Vector3
} from "three"
import { setMaterialUniforms } from "../lib/uniforms"
import { COLORS } from "../lib/colors"

export interface GridProps {
  position?: [number, number, number]
  size: number
  divisions: [number, number]
  /** Whether to generate the grid final lines */
  caps?: boolean
}

const gridMaterial = new ShaderMaterial({
  uniforms: {
    u_color: { value: COLORS.cyan },
    u_color2: { value: COLORS.violet },
    u_cameraPosition: { value: [0, 0, 0] }
  },
  vertexShader: /* glsl */ `
    attribute float lineDirection;
    varying vec3 v_worldPosition;
    varying float v_lineDirection;


    void main() {
      v_lineDirection = lineDirection;
      v_worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 u_color;
    uniform vec3 u_color2;
    uniform vec3 u_cameraPosition;
    varying vec3 v_worldPosition;
    varying float v_lineDirection;

    float valueRemap(float value, float low1, float high1, float low2, float high2) {
      return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
    }

    void main() {
      float distance = length(v_worldPosition - u_cameraPosition);

      float fadeEnd = mix(300.0, 50.0, v_lineDirection);
      float fade = valueRemap(distance, 0.0, fadeEnd, 1.0, 0.0);
      vec3 color = mix(u_color, u_color2, v_lineDirection);
      gl_FragColor = vec4(color, clamp(fade, 0.0, 1.0));
    }
  `,
  transparent: true,
  linewidth: 2
})

export const Grid = ({
  position = [0, 0, 0],
  size,
  divisions,
  caps = false
}: GridProps) => {
  const { camera } = useThree()
  const lineRef = useRef<LineSegments | null>(null)

  const [divisionsX, divisionsY] = useMemo(() => {
    if (Array.isArray(divisions)) {
      return divisions
    }

    return [divisions, divisions]
  }, [divisions])

  const lines = useMemo(() => {
    const points = []
    const types = []

    const stepX = (size * 2) / divisionsX

    for (let i = 0; i <= divisionsX; i++) {
      const position = -size + i * stepX

      points.push(new Vector3(position, 0, -size))
      points.push(new Vector3(position, 0, size))
      types.push(0, 0) // vertical
    }

    const stepY = (size * 2) / divisionsY

    for (let i = 0; i <= divisionsY; i++) {
      const position = -size + i * stepY

      points.push(new Vector3(-size, 0, position))
      points.push(new Vector3(size, 0, position))
      types.push(1, 1) // horizontal
    }

    if (caps) {
      points.push(new Vector3(-size, 0, -size))
      points.push(new Vector3(size, 0, -size))
      types.push(1, 1) // horizontal

      points.push(new Vector3(-size, 0, size))
      points.push(new Vector3(size, 0, size))
      types.push(1, 1) // horizontal
    }

    const geometry = new BufferGeometry().setFromPoints(points)
    geometry.setAttribute("lineDirection", new Float32BufferAttribute(types, 1))
    const line = new LineSegments(geometry, gridMaterial)

    return line
  }, [size, divisionsX, divisionsY, caps])

  useFrame(() => {
    if (lineRef.current) {
      setMaterialUniforms(gridMaterial, {
        u_cameraPosition: camera.position
      })
    }
  })

  return (
    <group position={position}>
      <primitive object={lines} ref={lineRef} />
    </group>
  )
}
