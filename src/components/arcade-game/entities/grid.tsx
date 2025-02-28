import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { Group, LineSegments, ShaderMaterial, Vector2 } from "three"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"
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
    u_cameraPosition: { value: [0, 0, 0] },
    u_lineWidth: { value: 19.0 }
  },
  vertexShader: /* glsl */ `
    uniform float u_lineWidth;
    attribute float lineDirection;
    varying vec3 v_worldPosition;
    varying float v_lineDirection;

    void main() {
      v_lineDirection = lineDirection;
      v_worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      
      vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
      vec4 projectedPos = projectionMatrix * viewPos;
      gl_Position = projectedPos;
      gl_PointSize = u_lineWidth;
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
  transparent: true
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
    const group = new Group()

    const stepX = (size * 2) / divisionsX

    for (let i = 0; i <= divisionsX; i++) {
      const position = -size + i * stepX

      const positions = [position, 0, -size, position, 0, size]

      const geometry = new LineGeometry()
      geometry.setPositions(positions)

      const material = new LineMaterial({
        color: COLORS.cyan,
        linewidth: 5,
        resolution: new Vector2(window.innerWidth, window.innerHeight),
        transparent: true,
        opacity: 0.8
      })

      const line = new Line2(geometry, material)
      group.add(line)
    }

    const stepY = (size * 2) / divisionsY

    for (let i = 0; i <= divisionsY; i++) {
      const position = -size + i * stepY

      const positions = [-size, 0, position, size, 0, position]

      const geometry = new LineGeometry()
      geometry.setPositions(positions)

      const material = new LineMaterial({
        color: COLORS.violet,
        linewidth: 5,
        resolution: new Vector2(window.innerWidth, window.innerHeight),
        transparent: true,
        opacity: 0.8
      })

      const line = new Line2(geometry, material)
      group.add(line)
    }

    if (caps) {
      const bottomGeometry = new LineGeometry()
      bottomGeometry.setPositions([-size, 0, -size, size, 0, -size])

      const topGeometry = new LineGeometry()
      topGeometry.setPositions([-size, 0, size, size, 0, size])

      const material = new LineMaterial({
        color: COLORS.violet,
        linewidth: 5,
        resolution: new Vector2(window.innerWidth, window.innerHeight),
        transparent: true,
        opacity: 0.8
      })

      group.add(new Line2(bottomGeometry, material.clone()))
      group.add(new Line2(topGeometry, material.clone()))
    }

    return group
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
