import { ShaderMaterial } from "three"

export const screenMaterial = new ShaderMaterial({
  uniforms: {
    map: { value: null }
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D map;
    varying vec2 vUv;
    
    vec2 curveUV(vec2 uv) {
      uv = uv * 2.0 - 1.0;
      vec2 offset = abs(uv.yx) / vec2(8.0, 6.0);
      uv = uv + uv * offset * offset;
      uv = uv * 0.5 + 0.5;
      return uv;
    }
    
    void main() {
      vec2 curvedUv = curveUV(vUv);
      
      // Discard pixels outside the curved area
      if (curvedUv.x < 0.0 || curvedUv.x > 1.0 || curvedUv.y < 0.0 || curvedUv.y > 1.0) {
        discard;
      }
      
      vec3 color = texture2D(map, curvedUv).rgb;
      float gray = dot(color, vec3(0.4, 0.5, 0.1));
      vec3 tint = vec3(1.0, 0.4, 0.0); // base color #FF6600
      tint.r *= 1.5;
      tint.g *= 0.9;
      gl_FragColor = vec4(tint * gray * 2.0, 1.0);
    }
  `
})
