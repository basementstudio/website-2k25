import { useMemo } from "react"
import {
  BufferGeometry,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3,
  EdgesGeometry
} from "three"

const material = new ShaderMaterial({
  uniforms: {
    lineSpacing: { value: 0.01 },
    lineWidth: { value: 0.21 },
    lineOpacity: { value: 0.2 },
    aspectRatio: { value: 1.0 }
  },
  vertexShader: `
   varying vec4 vPos;

	void main() {
		vPos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		gl_Position = vPos;
	}
  `,
  fragmentShader: `
   varying vec4 vPos;
   uniform float aspectRatio;
   uniform float lineSpacing;
   uniform float lineWidth;
   uniform float lineOpacity;
  
  void main() {
    vec2 vCoords = vPos.xy;
    vCoords /= vPos.w;
    vCoords = vCoords * 0.5 + 0.5;
    
    vCoords.x *= aspectRatio;

    float diagonal = (vCoords.x + vCoords.y) / lineSpacing;
    float pattern = fract(diagonal);
    float line = step(pattern, lineWidth);
    gl_FragColor = vec4(vec3(1.0), line * lineOpacity);
  }
  `,
  depthTest: false,
  depthWrite: false,
  transparent: true
})
const squareMaterial = new ShaderMaterial({
  uniforms: {
    color: { value: [1.0, 1.0, 1.0] },
    baseSize: { value: 0.05 },
    minViewSize: { value: 0.01 }
  },
  vertexShader: `
    uniform float baseSize;
    uniform float minViewSize;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      float distanceToCamera = length(cameraPosition - worldPosition.xyz);
      
      float scaleFactor = max(minViewSize, baseSize * pow(distanceToCamera / 5.0, 1.2));
      float scale = scaleFactor / baseSize;
      
      vec3 scaledPosition = position * scale;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      float thickness = 0.2;
      float vertical = step(0.5 - thickness/2.0, vUv.x) * step(vUv.x, 0.5 + thickness/2.0);
      float horizontal = step(0.5 - thickness/2.0, vUv.y) * step(vUv.y, 0.5 + thickness/2.0);
      float plus = max(vertical, horizontal);
      gl_FragColor = vec4(vec3(1.0), plus);
    }
  `,
  transparent: true,
  depthTest: false
})
const edgesMaterial = new ShaderMaterial({
  uniforms: {
    opacity: { value: 0.2 }
  },
  vertexShader: `
        varying vec3 vWorldPosition;
        
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
  fragmentShader: `
        uniform float opacity;
        varying vec3 vWorldPosition;
        
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, opacity);
        }
      `,
  transparent: true,
  depthTest: false
})

export const RoutingPlane = ({
  position,
  rotation,
  geometry,
  scale,
  visible,
  groupName
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  geometry: BufferGeometry
  scale: [number, number]
  visible: boolean
  groupName?: string
}) => {
  const squareGeometry = useMemo(() => new PlaneGeometry(0.05, 0.05), [])
  const squares =
    geometry.attributes.position && geometry.attributes.normal ? (
      <>
        {Array.from({ length: geometry.attributes.position.count }).map(
          (_, i) => {
            const x = geometry.attributes.position.array[i * 3] * scale[0]
            const y = geometry.attributes.position.array[i * 3 + 1] * scale[1]
            const z = geometry.attributes.position.array[i * 3 + 2]

            const nx = geometry.attributes.normal.array[i * 3]
            const ny = geometry.attributes.normal.array[i * 3 + 1]
            const nz = geometry.attributes.normal.array[i * 3 + 2]

            const quaternion = new Quaternion().setFromUnitVectors(
              new Vector3(0, 0, 1),
              new Vector3(nx, ny, nz)
            )

            return (
              <mesh
                key={i}
                geometry={squareGeometry}
                material={squareMaterial}
                position={[x, y, z]}
                quaternion={quaternion}
                scale={[1, 1, 1]}
                visible={groupName ? false : true}
              />
            )
          }
        )}
      </>
    ) : null

  const edgesGeometry = useMemo(() => new EdgesGeometry(geometry), [geometry])

  useMemo(() => {
    const updateAspectRatio = () => {
      const aspectRatio = window.innerWidth / window.innerHeight
      material.uniforms.aspectRatio.value = aspectRatio
    }

    updateAspectRatio()

    window.addEventListener("resize", updateAspectRatio)
    return () => window.removeEventListener("resize", updateAspectRatio)
  }, [])

  return (
    <group position={position} rotation={rotation} visible={visible}>
      <mesh
        geometry={geometry}
        scale={[scale[0], scale[1], 1]}
        material={material}
      ></mesh>
      <lineSegments
        geometry={edgesGeometry}
        material={edgesMaterial}
        scale={[scale[0], scale[1], 1]}
        visible={groupName ? false : true}
      />
      {squares}
    </group>
  )
}
