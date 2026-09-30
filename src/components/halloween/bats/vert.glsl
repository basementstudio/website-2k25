uniform float uTime;
uniform float uSeed;
uniform float uFlap;

void main() {
  vec3 p = position;
  // Wings beat about the shoulder: the further out, the bigger the swing,
  // with the tip trailing the root a little. Body (|x| ~ 0) barely moves.
  float reach = abs(p.x);
  float phase = uTime * uFlap + uSeed * 20.0 - reach * 2.5;
  p.y += sin(phase) * reach * 0.55;
  // Wing tips sweep back on the downstroke.
  p.z += cos(phase) * reach * reach * 0.12;
  // Body bobs against the wings.
  p.y -= sin(uTime * uFlap + uSeed * 20.0) * 0.05;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
