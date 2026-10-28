attribute float aWing;
attribute float aSeed;
uniform float uTime;
void main() {
  vec3 p = position;
  float flap = sin(uTime * 13.0 + aSeed * 31.0);
  p.y += abs(p.x) * flap * 0.95 * aWing;
  p.x *= 1.0 - abs(flap) * 0.28 * aWing;
  gl_Position =
    projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}
