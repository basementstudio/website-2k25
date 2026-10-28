attribute float aBirth;
attribute float aPresence;
attribute float aSeed;

uniform float uTime;
uniform float uLife;
uniform float uScale;
uniform vec2 uResolution;

varying float vAlpha;

void main() {
  float age = uTime - aBirth;
  float life = age / uLife;

  // Rise slowly, curling a little as it goes.
  vec3 p = position;
  float a = aSeed * 6.28 + age * 1.7;
  p += vec3(sin(a), 1.2, cos(a)) * age * 0.12 * uScale;

  vec4 view = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * view;

  // Puffs grow as they thin out.
  float size = uScale * (0.14 + life * 0.3);
  gl_PointSize = size * projectionMatrix[1][1] * uResolution.y * 0.5 / -view.z;

  vAlpha =
    smoothstep(0.0, 0.08, life) *
    pow(1.0 - clamp(life, 0.0, 1.0), 2.0) *
    aPresence;
  // Dead or not yet born: draw nothing.
  if (life <= 0.0 || life >= 1.0) gl_PointSize = 0.0;
}
