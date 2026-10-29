attribute float aSeed;
attribute float aLit;
attribute float aBend;
uniform float uTime;
uniform float uMotion;
varying vec2 vUv;
varying float vFlicker;
varying float vLit;

void main() {
  vUv = uv;
  float t = uTime + aSeed * 31.0;
  vLit = aLit;
  vFlicker = 0.94 + (0.04 * sin(t * 9.0) + 0.02 * sin(t * 17.3)) * uMotion;
  vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float width = length(instanceMatrix[0].xyz);
  float height = length(instanceMatrix[1].xyz);
  // A camera-facing flame, with its base fixed to the wick.
  vec2 p = vec2(position.x * width, (position.y + 0.5) * height);
  p.x += (sin(t * 4.2) * 0.09 * uMotion + aBend) * width * uv.y * uv.y;
  p.y *= vFlicker * mix(0.3, 1.0, aLit);
  center.xy += p;
  gl_Position = projectionMatrix * center;
}
