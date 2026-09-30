uniform float uTime;
uniform float uSeed;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  // Drafts stir the loose end of the web; the corner stays put.
  float r = length(uv);
  p.z += sin(uTime * 1.3 + uSeed * 12.0 + r * 4.0) * 0.02 * r * r;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
