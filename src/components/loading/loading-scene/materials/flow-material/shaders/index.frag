precision highp float;

in vec2 vUv;
in vec3 vWorldPosition;

out vec4 fragColor;

uniform float uRenderCount;

void main() {
  vec2 uv = vUv;
  
  // Create a simple flowing pattern
  float flow = sin(uv.x * 10.0 + uRenderCount * 0.1) * 
               cos(uv.y * 10.0 + uRenderCount * 0.05);
  
  // Add some color variation
  vec3 color = vec3(0.5 + 0.5 * flow);
  
  // Output final color
  fragColor = vec4(color, 1.0);
}
