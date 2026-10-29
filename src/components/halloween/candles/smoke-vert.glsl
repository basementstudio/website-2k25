attribute float aSeed;
attribute float aSmokeAge;
uniform float uMotion;
varying vec2 vUv;
varying float vAge;

void main() {
  vUv = uv;
  vAge = aSmokeAge;
  vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float width = length(instanceMatrix[0].xyz);
  float height = length(instanceMatrix[1].xyz);
  vec2 p = vec2(
    position.x * width * (0.5 + aSmokeAge),
    (position.y + 0.5) * height
  );
  p.y += aSmokeAge * height * 0.6 * uMotion;
  p.x +=
    sin(uv.y * 6.0 + aSeed * 12.0 + aSmokeAge * 5.0) *
    width *
    0.18 *
    uv.y *
    uMotion;
  center.xy += p;
  gl_Position = projectionMatrix * center;
}
