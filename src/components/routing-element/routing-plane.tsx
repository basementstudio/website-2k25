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
      },
      planeSize: {
        value: size
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
      uniform vec2 planeSize;
      
      void main() {
        vec2 uv = vUv;
        vec2 pixelSize = fwidth(uv);
        float borderWidth = 2.0;
        float worldSquareSize = 0.1;
        vec2 squareSize = worldSquareSize / planeSize; // Convert to UV space
        
        float aspectRatio = pixelSize.y / pixelSize.x;
        vec2 adjustedUV = vec2(uv.x, uv.y * aspectRatio);
        vec2 adjustedPixelSize = vec2(pixelSize.x, pixelSize.y * aspectRatio);
  
        float edge = step(uv.x, borderWidth * pixelSize.x) + 
                    step(1.0 - borderWidth * pixelSize.x, uv.x) +
                    step(uv.y, borderWidth * pixelSize.y) +
                    step(1.0 - borderWidth * pixelSize.y, uv.y);
        
        // calculate local uv for each corner plus shape
        vec2 localUV;
        float plus = 0.0;
        float plusThickness = 0.2;
        
        // bottom left
        if (uv.x < squareSize.x && uv.y < squareSize.y) {
          localUV = uv / squareSize;
          if (abs(localUV.y - 0.5) < plusThickness * 0.5 || 
              abs(localUV.x - 0.5) < plusThickness * 0.5) plus = 1.0;
        }
        // bottom right
        else if (uv.x > (1.0 - squareSize.x) && uv.y < squareSize.y) {
          localUV = (uv - vec2(1.0 - squareSize.x, 0.0)) / squareSize;
          if (abs(localUV.y - 0.5) < plusThickness * 0.5 || 
              abs(localUV.x - 0.5) < plusThickness * 0.5) plus = 1.0;
        }
        // Top left
        else if (uv.x < squareSize.x && uv.y > (1.0 - squareSize.y)) {
          localUV = (uv - vec2(0.0, 1.0 - squareSize.y)) / squareSize;
          if (abs(localUV.y - 0.5) < plusThickness * 0.5 || 
              abs(localUV.x - 0.5) < plusThickness * 0.5) plus = 1.0;
        }
        // top right
        else if (uv.x > (1.0 - squareSize.x) && uv.y > (1.0 - squareSize.y)) {
          localUV = (uv - vec2(1.0 - squareSize.x, 1.0 - squareSize.y)) / squareSize;
          if (abs(localUV.y - 0.5) < plusThickness * 0.5 || 
              abs(localUV.x - 0.5) < plusThickness * 0.5) plus = 1.0;
        }
    
        // discard if not on border or plus
        if(edge < 0.5 && plus < 0.5) {
          discard;
        }
        
        // White color with higher opacity for plus shapes
        vec3 color = vec3(1.0);
        float opacity = plus > 0.5 ? 1.0 : 0.05;
        gl_FragColor = vec4(color, opacity);
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
