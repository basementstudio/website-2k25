import { PlaneGeometry, ShaderMaterial } from "three"

export const RoutingPlane = ({
  position = [2.12, 3.57, -12.68] as [number, number, number],
  size = [3.3, 2.43] as [number, number],
  rotation = [0, Math.PI / 2, 0] as [number, number, number]
}) => {
  const material = new ShaderMaterial({
    uniforms: {
      thickness: {
        value: 1.0
      }
    },
    depthTest: false,
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float thickness;
      
      void main() {
        vec2 uv = vUv;
        vec2 pixelSize = fwidth(uv);
        float borderWidth = 2.0;
        
        // Calculate borders in pixel space to maintain consistent width
        float edge = step(uv.x, borderWidth * pixelSize.x) + 
                    step(1.0 - borderWidth * pixelSize.x, uv.x) +
                    step(uv.y, borderWidth * pixelSize.y) +
                    step(1.0 - borderWidth * pixelSize.y, uv.y);
                    
        // Discard if not on border
        if(edge < 0.5) {
          discard;
        }
        
        gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1);
      }`
  })

  const geo = new PlaneGeometry(size[0], size[1])

  return (
    <mesh
      geometry={geo}
      material={material}
      rotation={rotation}
      position={position}
    />
  )
}
