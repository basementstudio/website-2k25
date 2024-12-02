export const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  // Remove uScan uniform
  uniform sampler2D baseColorMap;
  uniform vec3 baseColor;
  uniform float opacity;
  uniform float uProgress;

  void main() {
  vec4 diffuseColor = vec4(baseColor, opacity);
  
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diff = max(dot(normalize(vNormal), lightDir), 0.0);
  vec3 litColor = diffuseColor.rgb * (diff + 0.1); 
  
  // Pixel calculation
  float pixelSize = 0.5; // Controls size of pixels
  vec2 pixelatedPos = floor(vWorldPosition.xz / pixelSize) * pixelSize;
  float dist = distance(pixelatedPos, vec2(2.0, -16.0));
    
  // Add noise to the edge
  float noise = fract(sin(dot(pixelatedPos, vec2(12.9898, 78.233))) * 43758.5453);
  float radialMove = step(dist + noise * 0.5, uProgress * 14.0);
    
  // Follow pixelation
  float borderWidth = pixelSize;
  float borderEdge = step(dist + noise * 0.5, uProgress * 14.0 + borderWidth) - radialMove;
  
  // Modify transparency based on radialMove
  float finalAlpha = mix(diffuseColor.a, 0.0, radialMove);
  
  vec3 scanColor = vec3(0.0, 0.2, 1.0);
  vec3 borderColor = vec3(0.0, 0.1, 0.8);
  
  gl_FragColor = vec4(litColor, finalAlpha);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, borderColor, borderEdge * 0.8);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;