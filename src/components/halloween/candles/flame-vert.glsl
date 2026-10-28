attribute float aSeed;
uniform float uTime;
varying vec2 vUv;
varying float vFlicker;

void main() {
  vUv = uv;
  float t = uTime + aSeed * 31.0;
  vFlicker = 0.88 + 0.08 * sin(t * 9.0) + 0.04 * sin(t * 17.3);
  vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float width = length(instanceMatrix[0].xyz);
  float height = length(instanceMatrix[1].xyz);
  // A camera-facing flame, with its base fixed to the wick.
  vec2 p = vec2(position.x * width, (position.y + 0.5) * height);
  p.x += sin(t * 4.2) * width * 0.09 * uv.y * uv.y;
  p.y *= vFlicker;
  center.xy += p;
  gl_Position = projectionMatrix * center;
}
