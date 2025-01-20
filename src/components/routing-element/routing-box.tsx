import { BoxGeometry, ShaderMaterial } from "three"

export const RoutingBox = ({
  position = [2.98, 1.08, -14.1] as [number, number, number],
  size = [1, 2.12, 0.8] as [number, number, number]
}) => {
  const material = new ShaderMaterial({
    uniforms: {
      thickness: {
        value: 3.2
      }
    },
    transparent: true,
    vertexShader: `
       varying vec2 vUv;
      void main()	{
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
      `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float thickness;
         
      float edgeFactor(vec2 p){
          vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p) / thickness;
            return min(grid.x, grid.y);
      }
      
      void main() {
        float a = edgeFactor(vUv);
        if(a > 0.5) {
          discard;
        }
        gl_FragColor = vec4(1.0, 1.0, 1.0, 0.15);
      }`
  })

  const geo = new BoxGeometry(1, 1, 1)

  return (
    <mesh geometry={geo} material={material} position={position} scale={size} />
  )
}
